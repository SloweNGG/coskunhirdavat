import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { retrieveQuoteWithPreview } from "../../../../../admin/quotes/helpers"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  res.json({
    quote: await retrieveQuoteWithPreview(req.scope, {
      id: req.params.id,
      customer_id: req.auth_context.actor_id,
    }),
  })
}
