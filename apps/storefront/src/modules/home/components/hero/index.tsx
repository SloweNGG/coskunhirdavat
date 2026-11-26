import Image from "next/image"
import { ArrowRight, ArrowsPointingOut, HandTruck } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { listHeroSlides, type HeroSlide } from "@lib/data/hero-slides"
import { STORE_INFO } from "@lib/store-config"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import HeroSlideView from "./slide"
import HeroSlider from "./slider"

/** The category's image (metadata.image_url, a product photo), if it has one. */
const categoryImage = (
  categories: HttpTypes.StoreProductCategory[],
  handle: string
) => {
  const url = categories.find((c) => c.handle === handle)?.metadata?.image_url
  return typeof url === "string" && url ? url : undefined
}

/** Product photo on a white tile in the promo card's bottom-right corner. */
const PromoPhoto = ({
  src,
  className = "",
}: {
  src: string
  className?: string
}) => (
  <span
    className={`absolute bottom-4 right-4 flex h-24 w-24 items-center justify-center rounded-2xl bg-white p-2 shadow-[0_8px_20px_rgba(0,0,0,0.12)] medium:h-32 medium:w-32 ${className}`}
  >
    <Image
      src={src}
      alt=""
      width={256}
      height={256}
      className="h-full w-full object-contain transition-transform group-hover:scale-105"
    />
  </span>
)

/** Shown when no slide is on (none set up in the admin, or the backend is unreachable). */
const DEFAULT_SLIDE: HeroSlide = {
  id: "default",
  eyebrow: STORE_INFO.tagline,
  title: "Ustaların tercihi,",
  accent: STORE_INFO.name,
  description:
    "Kumpas ve gönyeden kaynak teline, elmas testereden caraskal ve çember makinesine kadar atölye, şantiye ve depo için yüzlerce ürün uygun fiyat ve hızlı kargo ile kapınızda.",
  button_text: "Alışverişe Başla",
  button_url: "/store",
  secondary_button_text: "Kategorileri İncele",
  secondary_button_url: "#kategoriler",
  image_url: null,
  image_style: "card",
  theme: "dark",
  show_stamp: false,
  duration: 6,
}

const Hero = async ({
  categories = [],
}: {
  categories?: HttpTypes.StoreProductCategory[]
}) => {
  const measureImage = categoryImage(categories, "olcu-kontrol-aletleri")
  const liftingImage = categoryImage(categories, "kaldirma-tasima")
  const loaded = await listHeroSlides()
  const slides = loaded.length ? loaded : [DEFAULT_SLIDE]

  return (
    <section className="content-container pt-6 small:pt-8">
      <div className="grid grid-cols-1 gap-4 small:grid-cols-3 small:gap-5">
        {/* Main banner: slides from the admin ("Ana Sayfa Slaytları") */}
        <div className="small:col-span-2">
          <HeroSlider
            durations={slides.map((slide) => slide.duration)}
            cornerBlocks={slides.map((slide) => !!slide.show_stamp)}
            labels={slides.map((slide) =>
              [slide.title, slide.accent].filter(Boolean).join(" ")
            )}
            slides={slides.map((slide, i) => (
              <HeroSlideView key={slide.id} slide={slide} first={i === 0} />
            ))}
          />
        </div>

        {/* Side promos */}
        <div className="grid grid-cols-1 gap-4 xsmall:grid-cols-2 small:grid-cols-1 small:gap-5">
          <LocalizedClientLink
            href="/categories/olcu-kontrol-aletleri"
            className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-brand p-6 text-brand-fg"
          >
            {measureImage ? (
              <PromoPhoto src={measureImage} />
            ) : (
              <ArrowsPointingOut
                aria-hidden
                className="absolute -right-6 -top-6 h-40 w-40 text-black/10"
              />
            )}
            <div className="relative">
              <span className="text-xs font-semibold uppercase tracking-widest opacity-80">
                Ölçü ve Kontrol Aletleri
              </span>
              <h2 className="mt-2 text-xl font-bold leading-snug">
                Kumpas, gönye ve
                <br />
                su terazileri
              </h2>
            </div>
            <span className="relative mt-6 flex items-center gap-x-1 text-sm font-semibold group-hover:underline">
              Ürünleri gör <ArrowRight />
            </span>
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/categories/kaldirma-tasima"
            className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-brand-100 bg-brand-50 p-6 text-navy"
          >
            {liftingImage ? (
              <PromoPhoto
                src={liftingImage}
                className="border border-brand-100"
              />
            ) : (
              <HandTruck
                aria-hidden
                className="absolute -right-6 -top-6 h-40 w-40 text-brand-ink/10"
              />
            )}
            <div className="relative">
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-ink">
                Kaldırma ve Taşıma
              </span>
              <h2 className="mt-2 text-xl font-bold leading-snug">
                Caraskal, transpalet
                <br />
                ve vinçler
              </h2>
            </div>
            <span className="relative mt-6 flex items-center gap-x-1 text-sm font-semibold text-brand-ink group-hover:underline">
              Ürünleri gör <ArrowRight />
            </span>
          </LocalizedClientLink>
        </div>
      </div>
    </section>
  )
}

export default Hero
