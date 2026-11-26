import "server-only"

import { sdk } from "@lib/config"

/** A home slider slide, managed in the admin ("Ana Sayfa Slaytları"). */
export type HeroSlide = {
  id: string
  eyebrow: string | null
  title: string
  accent: string | null
  description: string | null
  button_text: string | null
  button_url: string | null
  secondary_button_text: string | null
  secondary_button_url: string | null
  image_url: string | null
  image_style: "card" | "background"
  theme: "dark" | "brand" | "light"
  show_stamp: boolean
  duration: number
}

// Admin changes reach the store within this many seconds.
const REVALIDATE_SECONDS = 60

/**
 * The slides currently on show (active, within their schedule), in order.
 * Empty when there are none or the backend can't be reached; the hero then
 * shows its built-in store slide.
 */
export const listHeroSlides = async (): Promise<HeroSlide[]> =>
  sdk.client
    .fetch<{ hero_slides: HeroSlide[] }>("/store/hero-slides", {
      next: { revalidate: REVALIDATE_SECONDS, tags: ["hero-slides"] },
      cache: "force-cache",
    })
    .then(({ hero_slides }) => hero_slides ?? [])
    .catch(() => [])
