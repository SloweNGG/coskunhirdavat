import { z } from "@medusajs/framework/zod"

// Empty text means "not set".
const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((value) => (value ? value : null))

// A store path ("/store"), an anchor ("#kategoriler") or a full http(s) URL.
const link = text(500).refine(
  (value) => value === null || /^(\/|#|https?:\/\/)/.test(value),
  "Bağlantı / veya # ile ya da http(s):// ile başlamalı"
)

const date = z.coerce.date().nullish().transform((value) => value ?? null)

const fields = {
  eyebrow: text(80),
  title: z.string().trim().min(1, "Başlık gerekli").max(120),
  accent: text(120),
  description: text(400),
  button_text: text(60),
  button_url: link,
  secondary_button_text: text(60),
  secondary_button_url: link,
  image_url: text(1000),
  image_style: z.enum(["card", "background"]),
  theme: z.enum(["dark", "brand", "light"]),
  show_stamp: z.boolean(),
  duration: z.number().int().min(2).max(30),
  is_active: z.boolean(),
  starts_at: date,
  ends_at: date,
}

const endsAfterStart = (data: { starts_at?: Date | null; ends_at?: Date | null }) =>
  !data.starts_at || !data.ends_at || data.ends_at > data.starts_at

export const AdminCreateHeroSlide = z
  .object(fields)
  .partial()
  .required({ title: true })
  .refine(endsAfterStart, "Bitiş tarihi başlangıçtan sonra olmalı")

export const AdminUpdateHeroSlide = z
  .object(fields)
  .partial()
  .refine(endsAfterStart, "Bitiş tarihi başlangıçtan sonra olmalı")

export const AdminReorderHeroSlides = z.object({
  ids: z.array(z.string().min(1)).min(1),
})

export type AdminCreateHeroSlideType = z.infer<typeof AdminCreateHeroSlide>
export type AdminUpdateHeroSlideType = z.infer<typeof AdminUpdateHeroSlide>
export type AdminReorderHeroSlidesType = z.infer<typeof AdminReorderHeroSlides>
