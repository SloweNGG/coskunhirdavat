import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HERO_SLIDE_MODULE } from "../../../modules/hero-slide"
import HeroSlideModuleService from "../../../modules/hero-slide/service"
import { createHeroSlideWorkflow } from "../../../workflows/hero-slides"
import type { AdminCreateHeroSlideType } from "./validators"

/** GET /admin/hero-slides: every slide, in slider order. */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const slides = await req.scope
    .resolve<HeroSlideModuleService>(HERO_SLIDE_MODULE)
    .listHeroSlides({}, { order: { rank: "ASC", created_at: "ASC" } })

  res.json({ hero_slides: slides })
}

/** POST /admin/hero-slides: adds a slide at the end. */
export const POST = async (
  req: MedusaRequest<AdminCreateHeroSlideType>,
  res: MedusaResponse
) => {
  const { result } = await createHeroSlideWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  res.json({ hero_slide: result })
}
