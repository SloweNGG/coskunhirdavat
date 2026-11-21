import { MedusaError } from "@medusajs/framework/utils"
import {
  StepResponse,
  WorkflowResponse,
  createStep,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import {
  updatePaymentSessionStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import type { PaytrBasketItem } from "../modules/paytr/client"
import type { PaytrTokenRequestData } from "../modules/paytr/service"

export const PAYTR_PROVIDER_ID = "pp_paytr_paytr"

export type PreparePaytrPaymentInput = {
  cart_id: string
  user_ip: string
}

type Address = {
  first_name?: string | null
  last_name?: string | null
  company?: string | null
  address_1?: string | null
  address_2?: string | null
  city?: string | null
  province?: string | null
  postal_code?: string | null
  country_code?: string | null
  phone?: string | null
} | null

type CartForPaytr = {
  id: string
  email?: string | null
  completed_at?: string | Date | null
  items?: Array<{
    title?: string | null
    product_title?: string | null
    variant_title?: string | null
    quantity: number
    unit_price: number | string
  } | null> | null
  shipping_methods?: Array<{ name?: string | null; amount: number | string } | null> | null
  shipping_address?: Address
  billing_address?: Address
  payment_collection?: {
    payment_sessions?: Array<{
      id: string
      provider_id: string
      status: string
      amount: number | string
      currency_code: string
      data?: Record<string, unknown> | null
    } | null> | null
  } | null
}

const money = (value: number | string) => Number(value).toFixed(2)

const joinParts = (parts: Array<string | null | undefined>, sep = " ") =>
  parts.filter((p) => !!p && String(p).trim()).join(sep).trim()

export const buildPaytrRequest = (
  cart: CartForPaytr,
  userIp: string
): { sessionId: string; amount: number | string; currencyCode: string; data: Record<string, unknown>; request: PaytrTokenRequestData } => {
  if (cart.completed_at) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Cart is already completed")
  }

  const session = cart.payment_collection?.payment_sessions?.find(
    (s) => s?.provider_id === PAYTR_PROVIDER_ID
  )

  if (!session) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Cart has no PayTR payment session. Select PayTR as the payment method first."
    )
  }

  const address = cart.shipping_address ?? cart.billing_address

  if (!cart.email || !address) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Cart needs an email and an address before payment"
    )
  }

  const basket: PaytrBasketItem[] = (cart.items ?? [])
    .filter((i): i is NonNullable<typeof i> => !!i)
    .map((item) => [
      joinParts([item.product_title ?? item.title, item.variant_title], " - ") || "Urun",
      money(item.unit_price),
      Number(item.quantity),
    ])

  for (const method of cart.shipping_methods ?? []) {
    if (method && Number(method.amount) > 0) {
      basket.push([method.name || "Kargo", money(method.amount), 1])
    }
  }

  const billing = cart.billing_address ?? address

  return {
    sessionId: session.id,
    amount: session.amount,
    currencyCode: session.currency_code,
    data: session.data ?? {},
    request: {
      user_ip: userIp,
      email: cart.email,
      user_name: joinParts([billing.first_name, billing.last_name]) || cart.email,
      user_address:
        joinParts(
          [
            billing.company,
            billing.address_1,
            billing.address_2,
            billing.postal_code,
            billing.city,
            billing.province,
          ],
          ", "
        ) || "-",
      user_phone: billing.phone || address.phone || "0000000000",
      basket,
      cart_id: cart.id,
      country_code: (address.country_code || "tr").toLowerCase(),
    },
  }
}

const buildPaytrRequestStep = createStep(
  "build-paytr-request",
  async (input: { cart: CartForPaytr; user_ip: string }) => {
    return new StepResponse(buildPaytrRequest(input.cart, input.user_ip))
  }
)

/**
 * Requests a PayTR iFrame token for a cart's PayTR payment session.
 * The cart data (amount, email, basket) is read server-side; only the
 * customer's IP comes from the caller.
 */
export const preparePaytrPaymentWorkflow = createWorkflow(
  "prepare-paytr-payment",
  (input: PreparePaytrPaymentInput) => {
    const { data: carts } = useQueryGraphStep({
      entity: "cart",
      fields: [
        "id",
        "email",
        "completed_at",
        "items.title",
        "items.product_title",
        "items.variant_title",
        "items.quantity",
        "items.unit_price",
        "shipping_methods.name",
        "shipping_methods.amount",
        "shipping_address.*",
        "billing_address.*",
        "payment_collection.payment_sessions.*",
      ],
      filters: { id: input.cart_id },
      options: { throwIfKeyNotFound: true },
    })

    const prepared = buildPaytrRequestStep({
      cart: transform({ carts }, ({ carts }) => carts[0] as unknown as CartForPaytr),
      user_ip: input.user_ip,
    })

    const updateInput = transform({ prepared }, ({ prepared }) => ({
      id: prepared.sessionId,
      amount: prepared.amount,
      currency_code: prepared.currencyCode,
      data: { ...prepared.data, paytr_request: prepared.request },
    }))

    const session = updatePaymentSessionStep(updateInput)

    const result = transform({ session }, ({ session }) => ({
      iframe_token: session.data?.iframe_token as string,
      merchant_oid: session.data?.merchant_oid as string,
    }))

    return new WorkflowResponse(result)
  }
)
