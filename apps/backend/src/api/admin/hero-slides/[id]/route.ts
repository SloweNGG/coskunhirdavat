import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  deleteHeroSlideWorkflow,
  updateHeroSlideWorkflow,
} from "../../../../workflows/hero-slides"
import type { AdminUpdateHeroSlideType } from "../validators"

/** POST /admin/hero-slides/:id: updates the given fields. */
export const POST = async (
  req: MedusaRequest<AdminUpdateHeroSlideType>,
  res: MedusaResponse
) => {
  const { result } = await updateHeroSlideWorkflow(req.scope).run({
    input: { id: req.params.id, data: req.validatedBody },
  })

  res.json({ hero_slide: result })
}

/** DELETE /admin/hero-slides/:id */
export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  await deleteHeroSlideWorkflow(req.scope).run({ input: req.params.id })

  res.json({ id: req.params.id, object: "hero_slide", deleted: true })
}
