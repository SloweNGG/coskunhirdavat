import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { reorderHeroSlidesWorkflow } from "../../../../workflows/hero-slides"
import { AdminReorderHeroSlides } from "../validators"

/**
 * POST /admin/hero-slides/reorder { ids }: sets the slider order, ids[0] first.
 * The body is checked here: the `/admin/hero-slides/:id` middleware matches
 * this path too, so a middleware validator here would clash with it.
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const parsed = AdminReorderHeroSlides.safeParse(req.body)
  if (!parsed.success) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "ids gerekli")
  }

  const { result } = await reorderHeroSlidesWorkflow(req.scope).run({
    input: parsed.data.ids,
  })

  res.json({ hero_slides: result })
}
