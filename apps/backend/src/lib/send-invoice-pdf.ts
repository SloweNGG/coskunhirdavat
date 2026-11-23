import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  generateInvoicePdfWorkflow,
  type GenerateInvoicePdfInput,
} from "../workflows/generate-invoice-pdf"

export async function sendInvoicePdf(
  req: MedusaRequest,
  res: MedusaResponse,
  input: GenerateInvoicePdfInput
) {
  const { result } = await generateInvoicePdfWorkflow(req.scope).run({ input })
  const pdf = Buffer.from(result.pdf_base64, "base64")
  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="proforma-fatura-${result.display_id ?? input.order_id}.pdf"`,
    "Content-Length": String(pdf.length),
    "Cache-Control": "private, no-store",
  })
  res.send(pdf)
}
