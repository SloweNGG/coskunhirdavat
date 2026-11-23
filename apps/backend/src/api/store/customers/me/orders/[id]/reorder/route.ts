import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { reorderWorkflow } from "../../../../../../../workflows/reorder"

/**
 * POST /store/customers/me/orders/:id/reorder
 * Creates a new cart from one of the logged-in customer's past orders.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { result } = await reorderWorkflow(req.scope).run({
    input: { order_id: req.params.id, customer_id: req.auth_context.actor_id },
  })

  res.json(result)
}
