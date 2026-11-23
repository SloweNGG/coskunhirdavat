import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { listQuotes } from "./helpers"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  res.json({ quotes: await listQuotes(req.scope, {}) })
}
