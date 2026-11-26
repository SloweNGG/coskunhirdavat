import { model } from "@medusajs/framework/utils"

/**
 * A slide of the storefront home page hero slider, managed in the admin
 * ("Ana Sayfa Slaytları"). The storefront shows the active slides whose
 * schedule includes now, ordered by `rank`.
 */
const HeroSlide = model.define("hero_slide", {
  id: model.id({ prefix: "hslide" }).primaryKey(),
  /** Small label above the title. */
  eyebrow: model.text().nullable(),
  /** First line of the heading. */
  title: model.text(),
  /** Second line of the heading, in the accent colour. */
  accent: model.text().nullable(),
  description: model.text().nullable(),
  /** Links: a store path ("/store", "/categories/x"), "#anchor" or a full URL. */
  button_text: model.text().nullable(),
  button_url: model.text().nullable(),
  secondary_button_text: model.text().nullable(),
  secondary_button_url: model.text().nullable(),
  image_url: model.text().nullable(),
  /** "card": photo on a white tile (product photos). "background": photo fills the slide. */
  image_style: model.enum(["card", "background"]).default("card"),
  /** Slide colours: dark base, brand colour, or light brand tint. */
  theme: model.enum(["dark", "brand", "light"]).default("dark"),
  /** Rubber stamp and drawing title block (the store's visual signature). */
  show_stamp: model.boolean().default(false),
  /** Seconds the slide stays before the next one. */
  duration: model.number().default(6),
  is_active: model.boolean().default(true),
  rank: model.number().default(0),
  starts_at: model.dateTime().nullable(),
  ends_at: model.dateTime().nullable(),
})

export default HeroSlide
