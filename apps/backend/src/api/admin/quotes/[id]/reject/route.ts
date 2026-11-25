import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { rejectQuoteWorkflow } from "../../../../../workflows/quotes"
import { retrieveQuoteWithPreview } from "../../helpers"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  await rejectQuoteWorkflow(req.scope).run({
    input: { quote_id: req.params.id },
  })
  res.json({
    quote: await retrieveQuoteWithPreview(req.scope, { id: req.params.id }),
  })
}
