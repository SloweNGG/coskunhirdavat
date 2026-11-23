import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { createRequestForQuoteWorkflow } from "../../../../../workflows/quotes"
import {
  CreateQuoteSchema,
  listQuotes,
  retrieveQuoteWithPreview,
} from "../../../../admin/quotes/helpers"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  res.json({
    quotes: await listQuotes(req.scope, {
      customer_id: req.auth_context.actor_id,
    }),
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<z.infer<typeof CreateQuoteSchema>>,
  res: MedusaResponse
) => {
  const customer_id = req.auth_context.actor_id
  const { result } = await createRequestForQuoteWorkflow(req.scope).run({
    input: { cart_id: req.validatedBody.cart_id, customer_id },
  })
  res.json({
    quote: await retrieveQuoteWithPreview(req.scope, {
      id: result.quote.id,
      customer_id,
    }),
  })
}
