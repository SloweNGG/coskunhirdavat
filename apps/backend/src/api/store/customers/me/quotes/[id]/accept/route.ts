import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { customerAcceptQuoteWorkflow } from "../../../../../../../workflows/quotes"
import { retrieveQuoteWithPreview } from "../../../../../../admin/quotes/helpers"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const filters = { id: req.params.id, customer_id: req.auth_context.actor_id }
  await customerAcceptQuoteWorkflow(req.scope).run({
    input: { quote_id: filters.id, customer_id: filters.customer_id },
  })
  res.json({ quote: await retrieveQuoteWithPreview(req.scope, filters) })
}
