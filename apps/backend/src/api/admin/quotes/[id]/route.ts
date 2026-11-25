import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { retrieveQuoteWithPreview } from "../helpers"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  res.json({
    quote: await retrieveQuoteWithPreview(req.scope, { id: req.params.id }),
  })
}
