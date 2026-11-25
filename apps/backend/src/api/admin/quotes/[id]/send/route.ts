import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { merchantSendQuoteWorkflow } from "../../../../../workflows/quotes"
import { retrieveQuoteWithPreview, SendQuoteSchema } from "../../helpers"

export const POST = async (
  req: MedusaRequest<z.infer<typeof SendQuoteSchema>>,
  res: MedusaResponse
) => {
  await merchantSendQuoteWorkflow(req.scope).run({
    input: { quote_id: req.params.id, items: req.validatedBody.items },
  })
  res.json({
    quote: await retrieveQuoteWithPreview(req.scope, { id: req.params.id }),
  })
}
