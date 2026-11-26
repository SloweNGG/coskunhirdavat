import { Text } from "@medusajs/ui"
import {
  formatMoney,
  formatNumber,
  formatPercent,
  paymentColor,
  SalesSummary,
} from "../../lib/overview"

type Props = { methods: SalesSummary["payment_methods"]; currency: string }

/**
 * How the period's sales split by payment method: a thin segmented bar over a
 * list that carries the names and figures, so the bar itself needs no text.
 */
export const PaymentMethods = ({ methods, currency }: Props) => {
  const parts = methods.filter((m) => m.revenue > 0)
  const total = parts.reduce((sum, m) => sum + m.revenue, 0)

  if (!total) {
    return (
      <Text size="small" className="text-ui-fg-muted">
        Bu dönemde ödeme yok.
      </Text>
    )
  }

  return (
    <div className="flex flex-col gap-y-4">
      <div
        className="flex h-2 w-full gap-x-0.5"
        role="img"
        aria-label={parts
          .map((m) => `${m.label} ${formatPercent(m.revenue / total)}`)
          .join(", ")}
      >
        {parts.map((m) => (
          <div
            key={m.provider_id}
            className="first:rounded-l-full last:rounded-r-full"
            style={{ flex: `${m.revenue} 1 0`, background: paymentColor(m.provider_id) }}
          />
        ))}
      </div>

      <ul className="flex flex-col gap-y-3">
        {parts.map((m) => (
          <li key={m.provider_id} className="flex items-start gap-x-3">
            <span
              className="mt-1 size-2.5 shrink-0 rounded-sm"
              style={{ background: paymentColor(m.provider_id) }}
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="txt-compact-small-plus text-ui-fg-base">{m.label}</span>
              <span className="txt-compact-small text-ui-fg-muted">
                {formatNumber(m.orders)} sipariş
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="txt-compact-small-plus text-ui-fg-base tabular-nums">
                {formatPercent(m.revenue / total)}
              </span>
              <span className="txt-compact-small text-ui-fg-subtle tabular-nums">
                {formatMoney(m.revenue, currency)}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
