import Image from "next/image"
import { ArrowRight } from "@medusajs/icons"
import type { HeroSlide } from "@lib/data/hero-slides"
import { STORE_INFO } from "@lib/store-config"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Stamp from "@modules/common/components/stamp"

// Room at the bottom of every slide for the slider's dots and arrows.
const PADDING = "p-8 pb-20 small:p-12 small:pb-24"

/** Colours per slide theme (chosen in the admin). */
const THEMES = {
  dark: {
    root: "bg-navy text-white",
    accent: "text-brand-bright",
    chip: "bg-brand text-brand-fg",
    body: "text-white/85",
    primary: "bg-brand text-brand-fg hover:bg-brand-dark",
    secondary: "border-white/60 text-white hover:bg-white/10",
    glow: "bg-brand/25",
    stamp: "text-brand-bright/80",
    block: "border-white/15 text-white/45",
    blockValue: "text-white/70",
    overlay:
      "bg-gradient-to-t from-navy via-navy/85 to-navy/30 xsmall:bg-gradient-to-r xsmall:via-navy/75 xsmall:to-navy/0",
  },
  brand: {
    root: "bg-brand text-brand-fg",
    accent: "text-navy",
    chip: "bg-navy text-white",
    body: "opacity-90",
    primary: "bg-navy text-white hover:bg-navy-light",
    secondary: "border-current hover:bg-black/10",
    glow: "bg-white/20",
    stamp: "text-navy/60",
    block: "border-black/15 opacity-70",
    blockValue: "",
    overlay:
      "bg-gradient-to-t from-brand via-brand/85 to-brand/30 xsmall:bg-gradient-to-r xsmall:via-brand/75 xsmall:to-brand/0",
  },
  light: {
    root: "bg-brand-50 text-navy",
    accent: "text-brand-ink",
    chip: "bg-brand text-brand-fg",
    body: "text-navy/75",
    primary: "bg-brand text-brand-fg hover:bg-brand-dark",
    secondary: "border-navy/30 text-navy hover:bg-navy/5",
    glow: "bg-brand/20",
    stamp: "text-brand-ink/70",
    block: "border-navy/15 text-navy/45",
    blockValue: "text-navy/70",
    overlay:
      "bg-gradient-to-t from-brand-50 via-brand-50/85 to-brand-50/30 xsmall:bg-gradient-to-r xsmall:via-brand-50/75 xsmall:to-brand-50/0",
  },
}

/** A store path goes through the country prefix; anchors and full URLs stay as they are. */
const SlideLink = ({
  href,
  className,
  children,
}: {
  href: string
  className: string
  children: React.ReactNode
}) =>
  href.startsWith("/") ? (
    <LocalizedClientLink href={href} className={className}>
      {children}
    </LocalizedClientLink>
  ) : (
    <a
      href={href}
      className={className}
      {...(href.startsWith("http")
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
    >
      {children}
    </a>
  )

/**
 * One slide of the home hero. The first slide's heading is the page's h1.
 * "card" images sit on a white tile (on top on phones, on the right from
 * `xsmall`); "background" images fill the slide under a fade in the theme
 * colour that keeps the text readable.
 */
const HeroSlideView = ({
  slide,
  first,
}: {
  slide: HeroSlide
  first: boolean
}) => {
  const t = THEMES[slide.theme] ?? THEMES.dark
  const Heading = first ? "h1" : "h2"
  const card = slide.image_url && slide.image_style === "card"
  const background = slide.image_url && slide.image_style === "background"

  return (
    <div
      className={`relative flex h-full flex-col justify-center gap-6 overflow-hidden xsmall:flex-row xsmall:items-center xsmall:justify-start xsmall:gap-8 ${PADDING} ${t.root}`}
    >
      {background && (
        <>
          <Image
            src={slide.image_url!}
            alt=""
            fill
            sizes="(min-width: 1024px) 66vw, 100vw"
            loading={first ? "eager" : "lazy"}
            className="object-cover"
          />
          <div aria-hidden className={`absolute inset-0 ${t.overlay}`} />
        </>
      )}
      {card && (
        <div
          aria-hidden
          className={`pointer-events-none absolute -right-10 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full blur-3xl ${t.glow}`}
        />
      )}

      {slide.show_stamp && (
        <>
          <Stamp
            text={`Ustaların tercihi • ${STORE_INFO.name} • `}
            className={`pointer-events-none absolute right-10 top-10 z-10 hidden -rotate-12 medium:flex ${t.stamp}`}
          />
          {/* Technical-drawing title block */}
          <dl
            aria-hidden
            className={`pointer-events-none absolute bottom-0 right-0 hidden grid-cols-[auto_auto] border-l border-t font-mono text-xs uppercase medium:grid ${t.block}`}
          >
            <dt className="border-b border-r border-inherit px-3 py-1.5">
              Çizim No
            </dt>
            <dd
              className={`border-b border-inherit px-3 py-1.5 ${t.blockValue}`}
            >
              CH-001
            </dd>
            <dt className="border-r border-inherit px-3 py-1.5">Ölçek</dt>
            <dd className={`px-3 py-1.5 ${t.blockValue}`}>1:1 · Usta işi</dd>
          </dl>
        </>
      )}

      {card && (
        <div className="relative flex h-40 w-full shrink-0 items-center justify-center rounded-2xl bg-white p-4 shadow-[0_16px_40px_rgba(0,0,0,0.3)] xsmall:order-last xsmall:ml-auto xsmall:mr-2 xsmall:h-40 xsmall:w-40 xsmall:rounded-3xl xsmall:p-5 xsmall:[rotate:3deg] small:h-52 small:w-52 medium:mr-6 medium:h-64 medium:w-64">
          <Image
            src={slide.image_url!}
            alt=""
            width={512}
            height={512}
            loading={first ? "eager" : "lazy"}
            className="h-full w-full object-contain"
          />
        </div>
      )}

      <div className="relative flex max-w-xl flex-1 flex-col gap-5">
        {slide.eyebrow && (
          <span
            className={`w-fit rounded px-3 py-1 font-mono text-xs font-medium uppercase tracking-widest ${t.chip}`}
          >
            {slide.eyebrow}
          </span>
        )}
        <Heading className="text-3xl font-bold leading-tight small:text-5xl small:leading-[1.1]">
          {slide.title}
          {slide.accent && (
            <>
              <br />
              <span className={t.accent}>{slide.accent}</span>
            </>
          )}
        </Heading>
        {slide.description && (
          <p className={`text-base small:text-lg ${t.body}`}>
            {slide.description}
          </p>
        )}
        {((slide.button_text && slide.button_url) ||
          (slide.secondary_button_text && slide.secondary_button_url)) && (
          <div className="flex flex-wrap gap-3 pt-2">
            {slide.button_text && slide.button_url && (
              <SlideLink
                href={slide.button_url}
                className={`flex items-center gap-x-2 rounded-lg px-6 py-3 text-sm font-semibold ${t.primary}`}
              >
                {slide.button_text}
                <ArrowRight />
              </SlideLink>
            )}
            {slide.secondary_button_text && slide.secondary_button_url && (
              <SlideLink
                href={slide.secondary_button_url}
                className={`flex items-center rounded-lg border px-6 py-3 text-sm font-semibold ${t.secondary}`}
              >
                {slide.secondary_button_text}
              </SlideLink>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default HeroSlideView
