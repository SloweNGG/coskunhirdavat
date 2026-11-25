import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { sendInvoicePdf } from "../../../../../lib/send-invoice-pdf"

// GET /admin/orders/:id/invoice - proforma invoice PDF for any order.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await sendInvoicePdf(req, res, { order_id: req.params.id })
}
