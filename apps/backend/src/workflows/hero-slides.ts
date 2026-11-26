import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { HERO_SLIDE_MODULE } from "../modules/hero-slide"
import HeroSlideModuleService from "../modules/hero-slide/service"

export type HeroSlideData = {
  eyebrow?: string | null
  title?: string
  accent?: string | null
  description?: string | null
  button_text?: string | null
  button_url?: string | null
  secondary_button_text?: string | null
  secondary_button_url?: string | null
  image_url?: string | null
  image_style?: "card" | "background"
  theme?: "dark" | "brand" | "light"
  show_stamp?: boolean
  duration?: number
  is_active?: boolean
  starts_at?: Date | null
  ends_at?: Date | null
}

const service = (container: { resolve: (key: string) => unknown }) =>
  container.resolve(HERO_SLIDE_MODULE) as HeroSlideModuleService

/** Creates a slide at the end of the order. */
const createHeroSlideStep = createStep(
  "create-hero-slide",
  async (input: HeroSlideData & { title: string }, { container }) => {
    const slides = service(container)
    const [last] = await slides.listHeroSlides(
      {},
      { select: ["rank"], order: { rank: "DESC" }, take: 1 }
    )
    const slide = await slides.createHeroSlides({
      ...input,
      rank: (last?.rank ?? -1) + 1,
    })
    return new StepResponse(slide, slide.id)
  },
  async (id, { container }) => {
    if (id) await service(container).deleteHeroSlides(id)
  }
)

export const createHeroSlideWorkflow = createWorkflow(
  "create-hero-slide",
  (input: HeroSlideData & { title: string }) =>
    new WorkflowResponse(createHeroSlideStep(input))
)

const updateHeroSlideStep = createStep(
  "update-hero-slide",
  async ({ id, data }: { id: string; data: HeroSlideData }, { container }) => {
    const slides = service(container)
    const original = await slides.retrieveHeroSlide(id)
    const slide = await slides.updateHeroSlides({ id, ...data })
    return new StepResponse(slide, original)
  },
  async (original, { container }) => {
    if (!original) return
    const { created_at: _c, updated_at: _u, deleted_at: _d, ...fields } = original
    await service(container).updateHeroSlides(fields)
  }
)

export const updateHeroSlideWorkflow = createWorkflow(
  "update-hero-slide",
  (input: { id: string; data: HeroSlideData }) =>
    new WorkflowResponse(updateHeroSlideStep(input))
)

/** Soft-deletes the slide, so a failure later can restore it. */
const deleteHeroSlideStep = createStep(
  "delete-hero-slide",
  async (id: string, { container }) => {
    await service(container).softDeleteHeroSlides(id)
    return new StepResponse(id, id)
  },
  async (id, { container }) => {
    if (id) await service(container).restoreHeroSlides(id)
  }
)

export const deleteHeroSlideWorkflow = createWorkflow(
  "delete-hero-slide",
  (id: string) => new WorkflowResponse(deleteHeroSlideStep(id))
)

/** Sets the order: `ids[0]` first. */
const reorderHeroSlidesStep = createStep(
  "reorder-hero-slides",
  async (ids: string[], { container }) => {
    const slides = service(container)
    const original = await slides.listHeroSlides(
      { id: ids },
      { select: ["id", "rank"] }
    )
    const updated = await slides.updateHeroSlides(
      ids.map((id, rank) => ({ id, rank }))
    )
    return new StepResponse(
      updated,
      original.map(({ id, rank }) => ({ id, rank }))
    )
  },
  async (original, { container }) => {
    if (original?.length) await service(container).updateHeroSlides(original)
  }
)

export const reorderHeroSlidesWorkflow = createWorkflow(
  "reorder-hero-slides",
  (ids: string[]) => new WorkflowResponse(reorderHeroSlidesStep(ids))
)
