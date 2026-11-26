import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HERO_SLIDE_MODULE } from "../modules/hero-slide"
import HeroSlideModuleService from "../modules/hero-slide/service"
import { createHeroSlideWorkflow, type HeroSlideData } from "../workflows/hero-slides"

/**
 * Creates the starting home slider slides: the store slide and one per
 * category (with the category's image). Does nothing when any slide exists,
 * so it is safe to run again; edit the slides in the admin afterwards
 * ("Ana Sayfa Slaytları").
 *
 *   npx medusa exec ./src/scripts/seed-hero-slides.ts
 */
export default async function seedHeroSlides({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const slides = container.resolve<HeroSlideModuleService>(HERO_SLIDE_MODULE)

  const [, existing] = await slides.listAndCountHeroSlides({}, { take: 1 })
  if (existing > 0) {
    logger.info(`Hero slides: ${existing} already exist, nothing created.`)
    return
  }

  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["handle", "name", "metadata"],
  })
  const imageOf = (handle: string) => {
    const url = categories.find((c) => c.handle === handle)?.metadata?.image_url
    return typeof url === "string" && url ? url : null
  }

  const categorySlide = (
    handle: string,
    title: string,
    accent: string,
    description: string,
    button: string
  ): HeroSlideData & { title: string } => ({
    eyebrow: categories.find((c) => c.handle === handle)?.name ?? null,
    title,
    accent,
    description,
    button_text: button,
    button_url: `/categories/${handle}`,
    image_url: imageOf(handle),
  })

  const input: (HeroSlideData & { title: string })[] = [
    {
      eyebrow: "Hırdavat ve Endüstriyel Malzemeler",
      title: "Ustaların tercihi,",
      accent: "Coşkun Hırdavat",
      description:
        "Kumpas ve gönyeden kaynak teline, elmas testereden caraskal ve çember makinesine kadar atölye, şantiye ve depo için yüzlerce ürün uygun fiyat ve hızlı kargo ile kapınızda.",
      button_text: "Alışverişe Başla",
      button_url: "/store",
      secondary_button_text: "Kategorileri İncele",
      secondary_button_url: "#kategoriler",
    },
    categorySlide(
      "kesme-asindirma",
      "Temiz kesim,",
      "uzun ömür",
      "Metal kesici taşlar, elmas testereler ve cırt zımparalar; atölye ve şantiye için profesyonel seri.",
      "Kesme ürünlerini gör"
    ),
    categorySlide(
      "kaynak-malzemeleri",
      "Sağlam kaynak,",
      "doğru malzeme",
      "Tungsten elektrotlar, kaynak telleri ve aksesuarlar; TIG ve MIG işleriniz için.",
      "Kaynak ürünlerini gör"
    ),
    categorySlide(
      "elektrikli-aletler",
      "Akü ve şarjda",
      "güçlü çözüm",
      "18V Li-Ion bataryalar, hızlı şarj üniteleri ve bits uçlar, uyumlu ve dayanıklı.",
      "Elektrikli aletleri gör"
    ),
    categorySlide(
      "paketleme-ambalaj",
      "Paketlemede",
      "hız ve güven",
      "Otomatik çember makineleri ve ambalaj malzemeleri; depo ve sevkiyat için.",
      "Paketleme ürünlerini gör"
    ),
  ]

  // One by one, so each lands at the end of the order.
  for (const slide of input) {
    await createHeroSlideWorkflow(container).run({ input: slide })
  }
  logger.info(`Hero slides: created ${input.length}.`)
}
