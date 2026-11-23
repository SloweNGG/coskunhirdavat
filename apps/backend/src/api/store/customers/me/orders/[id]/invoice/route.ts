import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { sendInvoicePdf } from "../../../../../../../lib/send-invoice-pdf"

// GET /store/customers/me/orders/:id/invoice - the logged-in customer's own
// order only (/store/customers/me/* requires customer auth by default).
export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  await sendInvoicePdf(req, res, {
    order_id: req.params.id,
    customer_id: req.auth_context.actor_id,
  })
}
