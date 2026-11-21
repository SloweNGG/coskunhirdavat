import { HttpTypes } from "@medusajs/types"
import { CATEGORY_ICONS } from "@lib/store-config"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import StoreIcon from "@modules/common/components/store-icon"
import SectionHeading from "../section-heading"

const CategoryGrid = ({
  categories,
}: {
  categories: HttpTypes.StoreProductCategory[]
}) => {
  if (!categories.length) {
    return null
  }

  return (
    <section id="kategoriler" className="content-container scroll-mt-40 py-10 small:py-14">
      <SectionHeading
        eyebrow="01 / Kategoriler"
        title="Ne arıyorsunuz?"
        subtitle="Aradığınız ürüne kategoriler üzerinden hızlıca ulaşın"
        href="/store"
        linkLabel="Tüm ürünler"
      />
      <ul className="grid grid-cols-2 gap-3 xsmall:grid-cols-4 small:gap-4 medium:grid-cols-8">
        {categories.map((c, index) => (
          <li key={c.id}>
            <LocalizedClientLink
              href={`/categories/${c.handle}`}
              className="group relative flex h-full flex-col items-center gap-3 rounded-xl border border-line bg-white px-3 py-6 text-center transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)]"
            >
              <span className="absolute left-3 top-2.5 font-mono text-[10px] font-semibold text-navy/30">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-ink transition-colors group-hover:bg-brand group-hover:text-brand-fg">
                <StoreIcon name={CATEGORY_ICONS[c.handle]} className="h-8 w-8" />
              </span>
              <span className="text-sm font-semibold leading-tight text-navy">
                {c.name}
              </span>
            </LocalizedClientLink>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default CategoryGrid
