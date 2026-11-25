import {
  beginOrderEditOrderWorkflow,
  confirmOrderEditRequestWorkflow,
  convertDraftOrderWorkflow,
  createOrderWorkflow,
  CreateOrderWorkflowInput,
  orderEditUpdateItemQuantityWorkflow,
  requestOrderEditRequestWorkflow,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { MedusaError, OrderStatus } from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { CreateOrderLineItemDTO } from "@medusajs/framework/types"
import { QUOTE_MODULE } from "../modules/quote"
import { QuoteStatus } from "../modules/quote/models/quote"
import QuoteModuleService from "../modules/quote/service"

// Adapted from medusajs/examples quotes-management: the quote wraps a draft
// order plus an order edit (order change). The merchant changes prices and
// quantities on the order edit; accepting confirms the edit and converts the
// draft into a real order.

const createQuotesStep = createStep(
  "create-quotes",
  async (
    input: {
      draft_order_id: string
      order_change_id: string
      cart_id: string
      customer_id: string
    }[],
    { container }
  ) => {
    const service: QuoteModuleService = container.resolve(QUOTE_MODULE)
    const quotes = await service.createQuotes(input)
    return new StepResponse(
      quotes,
      quotes.map((q) => q.id)
    )
  },
  async (ids, { container }) => {
    if (!ids) {
      return
    }
    const service: QuoteModuleService = container.resolve(QUOTE_MODULE)
    await service.deleteQuotes(ids)
  }
)

const updateQuoteStatusStep = createStep(
  "update-quote-status",
  async (input: { id: string; status: QuoteStatus }, { container }) => {
    const service: QuoteModuleService = container.resolve(QUOTE_MODULE)
    const before = await service.retrieveQuote(input.id)
    const quote = await service.updateQuotes(input)
    return new StepResponse(quote, { id: before.id, status: before.status })
  },
  async (prev, { container }) => {
    if (!prev) {
      return
    }
    const service: QuoteModuleService = container.resolve(QUOTE_MODULE)
    await service.updateQuotes(prev)
  }
)

const validateQuoteStatusStep = createStep(
  "validate-quote-status",
  async (input: { status: string; allowed: QuoteStatus[] }) => {
    if (!input.allowed.includes(input.status as QuoteStatus)) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Bu işlem teklif durumu "${input.status}" iken yapılamaz.`
      )
    }
  }
)

const validateCartForQuoteStep = createStep(
  "validate-cart-for-quote",
  async (input: {
    cart: { customer_id?: string | null; items?: unknown[] | null }
    customer_id: string
  }) => {
    if (input.cart.customer_id && input.cart.customer_id !== input.customer_id) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Bu sepet size ait değil.")
    }
    if (!input.cart.items?.length) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Sepet boş.")
    }
  }
)

export const createRequestForQuoteWorkflow = createWorkflow(
  "create-request-for-quote",
  (input: { cart_id: string; customer_id: string }) => {
    const { data: carts } = useQueryGraphStep({
      entity: "cart",
      fields: [
        "id",
        "customer_id",
        "sales_channel_id",
        "currency_code",
        "region_id",
        "shipping_address.*",
        "billing_address.*",
        "items.*",
        "shipping_methods.*",
        "promotions.code",
      ],
      filters: { id: input.cart_id },
      options: { throwIfKeyNotFound: true },
    })

    const { data: customers } = useQueryGraphStep({
      entity: "customer",
      fields: ["id", "email"],
      filters: { id: input.customer_id },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "customer-query" })

    validateCartForQuoteStep({ cart: carts[0], customer_id: input.customer_id })

    const orderInput = transform({ carts, customers }, ({ carts, customers }) => {
      const cart = carts[0]
      return {
        is_draft_order: true,
        status: OrderStatus.DRAFT,
        sales_channel_id: cart.sales_channel_id || undefined,
        email: customers[0].email || undefined,
        customer_id: customers[0].id,
        billing_address: cart.billing_address,
        shipping_address: cart.shipping_address,
        items: (cart.items as CreateOrderLineItemDTO[]) || [],
        region_id: cart.region_id || undefined,
        promo_codes: cart.promotions?.map((p) => p?.code),
        currency_code: cart.currency_code,
        shipping_methods: cart.shipping_methods || [],
      } as CreateOrderWorkflowInput
    })

    const draftOrder = createOrderWorkflow.runAsStep({ input: orderInput })

    const orderChange = beginOrderEditOrderWorkflow.runAsStep({
      input: transform({ draftOrder }, ({ draftOrder }) => ({
        order_id: draftOrder.id,
      })),
    })

    const quotes = createQuotesStep(
      transform(
        { draftOrder, carts, customers, orderChange },
        ({ draftOrder, carts, customers, orderChange }) => [
          {
            draft_order_id: draftOrder.id,
            cart_id: carts[0].id,
            customer_id: customers[0].id,
            order_change_id: orderChange.id,
          },
        ]
      )
    )

    return new WorkflowResponse({ quote: quotes[0] })
  }
)

export const merchantSendQuoteWorkflow = createWorkflow(
  "merchant-send-quote",
  (input: {
    quote_id: string
    items: { id: string; quantity: number; unit_price: number }[]
  }) => {
    const { data: quotes } = useQueryGraphStep({
      entity: "quote",
      fields: ["id", "status", "draft_order_id"],
      filters: { id: input.quote_id },
      options: { throwIfKeyNotFound: true },
    })

    validateQuoteStatusStep({
      status: quotes[0].status,
      allowed: [QuoteStatus.PENDING_MERCHANT],
    })

    orderEditUpdateItemQuantityWorkflow.runAsStep({
      input: { order_id: quotes[0].draft_order_id, items: input.items },
    })

    requestOrderEditRequestWorkflow.runAsStep({
      input: { order_id: quotes[0].draft_order_id, no_notification: true },
    })

    return new WorkflowResponse(
      updateQuoteStatusStep({
        id: input.quote_id,
        status: QuoteStatus.PENDING_CUSTOMER,
      })
    )
  }
)

export const customerAcceptQuoteWorkflow = createWorkflow(
  "customer-accept-quote",
  (input: { quote_id: string; customer_id: string }) => {
    const { data: quotes } = useQueryGraphStep({
      entity: "quote",
      fields: ["id", "status", "draft_order_id"],
      filters: { id: input.quote_id, customer_id: input.customer_id },
      options: { throwIfKeyNotFound: true },
    })

    validateQuoteStatusStep({
      status: quotes[0].status,
      allowed: [QuoteStatus.PENDING_CUSTOMER],
    })

    const quote = updateQuoteStatusStep({
      id: input.quote_id,
      status: QuoteStatus.ACCEPTED,
    })

    confirmOrderEditRequestWorkflow.runAsStep({
      input: {
        order_id: quotes[0].draft_order_id,
        confirmed_by: input.customer_id,
      },
    })

    // Unlike the recipe, use the core conversion so inventory gets reserved.
    convertDraftOrderWorkflow.runAsStep({
      input: { id: quotes[0].draft_order_id },
    })

    return new WorkflowResponse(quote)
  }
)

export const rejectQuoteWorkflow = createWorkflow(
  "reject-quote",
  (input: { quote_id: string; customer_id?: string }) => {
    const filters = transform({ input }, ({ input }) =>
      input.customer_id
        ? { id: input.quote_id, customer_id: input.customer_id }
        : { id: input.quote_id }
    )
    const { data: quotes } = useQueryGraphStep({
      entity: "quote",
      fields: ["id", "status"],
      filters,
      options: { throwIfKeyNotFound: true },
    })

    validateQuoteStatusStep({
      status: quotes[0].status,
      allowed: [QuoteStatus.PENDING_MERCHANT, QuoteStatus.PENDING_CUSTOMER],
    })

    const status = transform({ input }, ({ input }) =>
      input.customer_id
        ? QuoteStatus.CUSTOMER_REJECTED
        : QuoteStatus.MERCHANT_REJECTED
    )
    return new WorkflowResponse(
      updateQuoteStatusStep({ id: input.quote_id, status })
    )
  }
)
