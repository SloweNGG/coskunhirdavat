import { Text } from "@medusajs/ui"
import { Link } from "react-router-dom"
import { formatMoney, formatNumber, SalesSummary } from "../../lib/overview"

type Props = { items: SalesSummary["top_products"]; currency: string }

/** Best sellers by units sold: ranked horizontal bars, one hue, value at the tip. */
export const TopProducts = ({ items, currency }: Props) => {
  if (!items.length) {
    return (
      <Text size="small" className="text-ui-fg-muted">
        Bu dönemde satılan ürün yok.
      </Text>
    )
  }

  const max = Math.max(1, ...items.map((p) => p.quantity))

  return (
    <ul className="flex flex-col gap-y-4">
      {items.map((p) => (
        <li key={p.product_id ?? p.title} className="flex flex-col gap-y-1.5">
          <div className="flex items-baseline justify-between gap-x-3">
            {p.product_id ? (
              <Link
                to={`/products/${p.product_id}`}
                className="txt-compact-small-plus text-ui-fg-base hover:text-ui-fg-interactive truncate"
              >
                {p.title}
              </Link>
            ) : (
              <span className="txt-compact-small-plus text-ui-fg-base truncate">{p.title}</span>
            )}
            <span className="txt-compact-small text-ui-fg-subtle shrink-0 tabular-nums">
              {formatMoney(p.revenue, currency)}
            </span>
          </div>
          <div className="flex items-center gap-x-2">
            <div
              className="h-3 shrink-0"
              style={{
                width: `calc((100% - 80px) * ${p.quantity / max})`,
                minWidth: 2,
                background: "var(--series-1)",
                borderRadius: "0 4px 4px 0",
              }}
            />
            <span className="txt-compact-small text-ui-fg-base whitespace-nowrap tabular-nums">
              {formatNumber(p.quantity)} adet
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}
