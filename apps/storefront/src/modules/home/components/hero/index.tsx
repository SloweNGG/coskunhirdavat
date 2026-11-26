import { ArrowRight, Bolt, ShieldCheck } from "@medusajs/icons"
import { STORE_INFO } from "@lib/store-config"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Stamp from "@modules/common/components/stamp"

const Hero = () => {
  return (
    <section className="content-container pt-6 small:pt-8">
      <div className="grid grid-cols-1 gap-4 small:grid-cols-3 small:gap-5">
        {/* Main banner */}
        <div className="blueprint-dark relative overflow-hidden rounded-xl bg-navy p-8 text-white small:col-span-2 small:p-12">
          <Stamp
            text={`Ustaların tercihi • ${STORE_INFO.name} • `}
            className="pointer-events-none absolute right-10 top-10 hidden -rotate-12 text-brand-bright/80 medium:flex"
          />
          {/* Technical-drawing title block */}
          <dl
            aria-hidden
            className="pointer-events-none absolute bottom-0 right-0 hidden grid-cols-[auto_auto] border-l border-t border-white/15 font-mono text-xs uppercase text-white/45 medium:grid"
          >
            <dt className="border-b border-r border-white/15 px-3 py-1.5">Çizim No</dt>
            <dd className="border-b border-white/15 px-3 py-1.5 text-white/70">CH-001</dd>
            <dt className="border-r border-white/15 px-3 py-1.5">Ölçek</dt>
            <dd className="px-3 py-1.5 text-white/70">1:1 · Usta işi</dd>
          </dl>
          <div className="relative flex max-w-xl flex-col gap-5">
            <span className="w-fit rounded bg-brand px-3 py-1 font-mono text-xs font-medium uppercase tracking-widest text-brand-fg">
              {STORE_INFO.tagline}
            </span>
            <h1 className="text-3xl font-bold leading-tight small:text-5xl small:leading-[1.1]">
              Ustaların tercihi,
              <br />
              <span className="text-brand-bright">{STORE_INFO.name}</span>
            </h1>
            <p className="text-base text-white/85 small:text-lg">
              El aletlerinden elektrikli aletlere, bağlantı elemanlarından iş
              güvenliğine kadar binlerce ürün uygun fiyat ve hızlı kargo ile
              kapınızda.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <LocalizedClientLink
                href="/store"
                className="flex items-center gap-x-2 rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-brand-fg hover:bg-brand-dark"
              >
                Alışverişe Başla
                <ArrowRight />
              </LocalizedClientLink>
              <a
                href="#kategoriler"
                className="flex items-center rounded-lg border border-white/60 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Kategorileri İncele
              </a>
            </div>
          </div>
        </div>

        {/* Side promos */}
        <div className="grid grid-cols-1 gap-4 xsmall:grid-cols-2 small:grid-cols-1 small:gap-5">
          <LocalizedClientLink
            href="/categories/elektrikli-aletler"
            className="group relative flex flex-col justify-between overflow-hidden rounded-xl bg-brand p-6 text-brand-fg"
          >
            <Bolt
              aria-hidden
              className="absolute -right-6 -top-6 h-40 w-40 text-black/10"
            />
            <div className="relative">
              <span className="text-xs font-semibold uppercase tracking-widest opacity-80">
                Fırsat Köşesi
              </span>
              <h2 className="mt-2 text-xl font-bold leading-snug">
                Elektrikli aletlerde
                <br />
                avantajlı fiyatlar
              </h2>
            </div>
            <span className="relative mt-6 flex items-center gap-x-1 text-sm font-semibold group-hover:underline">
              Ürünleri gör <ArrowRight />
            </span>
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/categories/is-guvenligi"
            className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-brand-100 bg-brand-50 p-6 text-navy"
          >
            <ShieldCheck
              aria-hidden
              className="absolute -right-6 -top-6 h-40 w-40 text-brand-ink/10"
            />
            <div className="relative">
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-ink">
                İş Güvenliği
              </span>
              <h2 className="mt-2 text-xl font-bold leading-snug">
                Güvenli çalışma için
                <br />
                gereken her şey
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
