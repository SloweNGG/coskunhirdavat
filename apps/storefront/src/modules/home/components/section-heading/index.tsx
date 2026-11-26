import { ArrowRight } from "@medusajs/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const SectionHeading = ({
  title,
  subtitle,
  eyebrow,
  href,
  linkLabel = "Tümünü gör",
}: {
  title: string
  subtitle?: string
  /** Small mono label above the title, e.g. "Kategoriler" */
  eyebrow?: string
  href?: string
  linkLabel?: string
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          {eyebrow && (
            <span className="font-mono text-xs font-medium uppercase tracking-widest text-brand-ink">
              {eyebrow}
            </span>
          )}
          <h2 className="text-2xl font-bold text-navy small:text-[28px]">{title}</h2>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
        {href && (
          <LocalizedClientLink
            href={href}
            className="flex shrink-0 items-center gap-x-1 text-sm font-semibold text-brand-ink hover:text-navy"
          >
            {linkLabel}
            <ArrowRight />
          </LocalizedClientLink>
        )}
      </div>
    </div>
  )
}

export default SectionHeading
