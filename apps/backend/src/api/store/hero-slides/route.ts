import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { HERO_SLIDE_MODULE } from "../../../modules/hero-slide"
import HeroSlideModuleService from "../../../modules/hero-slide/service"

const PUBLIC_FIELDS = [
  "id",
  "eyebrow",
  "title",
  "accent",
  "description",
  "button_text",
  "button_url",
  "secondary_button_text",
  "secondary_button_url",
  "image_url",
  "image_style",
  "theme",
  "show_stamp",
  "duration",
  "starts_at",
  "ends_at",
] as const

/**
 * GET /store/hero-slides: the home slider's slides, in order. Only active
 * ones whose schedule (starts_at / ends_at, either may be empty) includes now.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const slides = await req.scope
    .resolve<HeroSlideModuleService>(HERO_SLIDE_MODULE)
    .listHeroSlides(
      { is_active: true },
      { select: [...PUBLIC_FIELDS], order: { rank: "ASC", created_at: "ASC" } }
    )

  const now = Date.now()
  const current = slides.filter(
    (slide) =>
      (!slide.starts_at || new Date(slide.starts_at).getTime() <= now) &&
      (!slide.ends_at || new Date(slide.ends_at).getTime() > now)
  )

  res.json({ hero_slides: current })
}
