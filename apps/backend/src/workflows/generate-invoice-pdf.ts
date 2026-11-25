import {
  StepResponse,
  WorkflowResponse,
  createStep,
  createWorkflow,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import { buildInvoicePdf, type InvoiceOrder } from "../lib/invoice-pdf"

export type GenerateInvoicePdfInput = {
  order_id: string
  // When set, the order must belong to this customer (store route).
  customer_id?: string
}

const generateInvoicePdfStep = createStep(
  "generate-invoice-pdf",
  async (order: InvoiceOrder) => {
    const pdf = await buildInvoicePdf(order)
    // Base64 keeps the result serializable through the workflow engine.
    return new StepResponse({
      pdf_base64: pdf.toString("base64"),
      display_id: order.display_id,
    })
  }
)

export const generateInvoicePdfWorkflow = createWorkflow(
  "generate-invoice-pdf",
  (input: GenerateInvoicePdfInput) => {
    const filters = transform({ input }, ({ input }) =>
      input.customer_id
        ? { id: input.order_id, customer_id: input.customer_id }
        : { id: input.order_id }
    )

    const { data: orders } = useQueryGraphStep({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "created_at",
        "email",
        "metadata",
        "currency_code",
        "total",
        "subtotal",
        "tax_total",
        "discount_total",
        "shipping_total",
        "billing_address.*",
        "items.*",
        "items.total",
        "items.original_total",
        "items.tax_total",
        "items.tax_lines.*",
        "shipping_methods.*",
        "shipping_methods.total",
        "shipping_methods.original_total",
        "shipping_methods.tax_total",
        "shipping_methods.tax_lines.*",
      ],
      filters,
      options: { throwIfKeyNotFound: true },
    })

    const order = transform({ orders }, ({ orders }) => orders[0] as InvoiceOrder)

    return new WorkflowResponse(generateInvoicePdfStep(order))
  }
)
