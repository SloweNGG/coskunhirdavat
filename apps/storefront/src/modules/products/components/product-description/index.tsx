import { CheckMini, ChevronDownMini } from "@medusajs/icons"
import type {
  DescriptionBlock,
  DescriptionItem,
  DescriptionRow,
} from "@lib/util/product-description"
import { clx } from "@modules/common/components/ui"

/**
 * Styled product description. Blocks come from `parseDescription`
 * (lib/util/product-description.ts); the owner edits the plain text in the
 * admin ("Ürün açıklaması" widget on the product page).
 */
const ProductDescription = ({ blocks }: { blocks: DescriptionBlock[] }) => (
  <div className="flex flex-col gap-5 text-[15px] leading-7 text-navy/80">
    {blocks.map((block, n) => {
      switch (block.type) {
        case "heading":
          return (
            <h3
              key={n}
              className={clx(
                "flex items-center gap-2.5 text-base font-semibold leading-6 text-navy",
                n > 0 && "pt-3"
              )}
            >
              <span
                aria-hidden
                className="h-5 w-1 shrink-0 rounded-full bg-brand"
              />
              {block.text}
            </h3>
          )
        case "paragraph":
          // A short first line is usually the product's full name: show it as a lead
          if (
            n === 0 &&
            !block.label &&
            block.text.length <= 120 &&
            !block.text.includes("\n")
          ) {
            return (
              <p key={n} className="text-lg font-semibold leading-7 text-navy">
                {block.text}
              </p>
            )
          }
          return (
            <p key={n} className="whitespace-pre-line">
              {block.label && (
                <strong className="font-semibold text-navy">
                  {block.label}:{" "}
                </strong>
              )}
              {block.text}
            </p>
          )
        case "list":
          return <DescriptionList key={n} items={block.items} />
        case "specs":
          return <SpecTable key={n} rows={block.rows} />
        case "faq":
          return (
            <div
              key={n}
              className="divide-y divide-line overflow-hidden rounded-xl border border-line"
            >
              {block.items.map((item) => (
                <details key={item.question} className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 font-semibold leading-6 text-navy hover:bg-soft [&::-webkit-details-marker]:hidden">
                    {item.question}
                    <ChevronDownMini className="shrink-0 text-muted transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="px-4 pb-4">{item.answer}</p>
                </details>
              ))}
            </div>
          )
      }
    })}
  </div>
)

const Check = () => (
  <span
    aria-hidden
    className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-ink"
  >
    <CheckMini />
  </span>
)

const DescriptionList = ({ items }: { items: DescriptionItem[] }) => {
  const labelled = items.filter((i) => i.label).length
  // "• Başlık: uzun açıklama" items read best as feature cards
  if (labelled >= 2 && labelled >= items.length / 2) {
    return (
      <ul className="grid grid-cols-1 gap-3 small:grid-cols-2">
        {items.map((item, n) => (
          <li
            key={n}
            className="flex gap-3 rounded-xl border border-line bg-soft/60 p-4 leading-6"
          >
            <Check />
            <div>
              {item.label && (
                <p className="font-semibold text-navy">{item.label}</p>
              )}
              <p className={clx(item.label && "mt-1 text-sm leading-6")}>
                {item.text}
              </p>
            </div>
          </li>
        ))}
      </ul>
    )
  }
  const short =
    items.length >= 4 && items.every((i) => !i.label && i.text.length <= 40)
  return (
    <ul
      className={clx(
        "grid grid-cols-1 gap-x-6 gap-y-2",
        short && "small:grid-cols-2"
      )}
    >
      {items.map((item, n) => (
        <li key={n} className="flex gap-3">
          <Check />
          <span>
            {item.label && (
              <strong className="font-semibold text-navy">
                {item.label}:{" "}
              </strong>
            )}
            {item.text}
          </span>
        </li>
      ))}
    </ul>
  )
}

export const SpecTable = ({ rows }: { rows: DescriptionRow[] }) => (
  <dl className="overflow-hidden rounded-xl border border-line text-sm leading-6">
    {rows.map((row, n) => (
      <div
        key={`${row.label}-${n}`}
        className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 px-4 py-2.5 odd:bg-soft"
      >
        <dt className="text-muted">{row.label}</dt>
        <dd className="font-medium text-navy">{row.value}</dd>
      </div>
    ))}
  </dl>
)

export default ProductDescription
