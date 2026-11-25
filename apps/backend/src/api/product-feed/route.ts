import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { generateProductFeedWorkflow } from "../../workflows/generate-product-feed"

// GET /product-feed?currency_code=try&country_code=tr
// Google Merchant Center RSS 2.0 feed. Public: lists published products only.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const code = (v: unknown, fallback: string, len: number) =>
    typeof v === "string" && new RegExp(`^[a-zA-Z]{${len}}$`).test(v)
      ? v.toLowerCase()
      : fallback

  const { result } = await generateProductFeedWorkflow(req.scope).run({
    input: {
      currency_code: code(req.query.currency_code, "try", 3),
      country_code: code(req.query.country_code, "tr", 2),
    },
  })

  res.setHeader("Content-Type", "application/rss+xml; charset=utf-8")
  res.setHeader("Cache-Control", "public, max-age=3600")
  res.status(200).send(result.xml)
}
