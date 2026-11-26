import { ArrowDownMini, ArrowUpMini } from "@medusajs/icons"
import { clx, Text } from "@medusajs/ui"
import { formatPercent } from "../../lib/overview"

type Props = {
  label: string
  value: string
  current: number
  previous: number
  /** e.g. "önceki 30 güne göre" */
  comparedTo: string
}

/** Label, headline value and the change against the previous period. */
export const StatTile = ({ label, value, current, previous, comparedTo }: Props) => {
  return (
    <div className="bg-ui-bg-base flex flex-col gap-y-1 px-6 py-4">
      <Text size="small" className="text-ui-fg-subtle">
        {label}
      </Text>
      <span className="text-ui-fg-base text-2xl font-medium leading-8">{value}</span>
      <Delta current={current} previous={previous} comparedTo={comparedTo} />
    </div>
  )
}

const Delta = ({
  current,
  previous,
  comparedTo,
}: Pick<Props, "current" | "previous" | "comparedTo">) => {
  if (previous <= 0) {
    return (
      <Text size="small" className="text-ui-fg-muted">
        {current > 0 ? "Önceki dönemde hiç yoktu" : "Bu dönemde yok"}
      </Text>
    )
  }

  const ratio = (current - previous) / previous
  // Under half a percent reads as "no change" rather than a tiny arrow.
  const direction = ratio > 0.005 ? "up" : ratio < -0.005 ? "down" : "flat"

  return (
    <div className="txt-compact-small flex flex-wrap items-center gap-x-1">
      <span
        className={clx("flex items-center font-medium", {
          "text-ui-tag-green-text": direction === "up",
          "text-ui-tag-red-text": direction === "down",
          "text-ui-fg-subtle": direction === "flat",
        })}
      >
        {direction === "up" && <ArrowUpMini />}
        {direction === "down" && <ArrowDownMini />}
        {direction === "flat"
          ? "Değişim yok"
          : `${formatPercent(Math.abs(ratio))} ${direction === "up" ? "artış" : "düşüş"}`}
      </span>
      <span className="text-ui-fg-muted">{comparedTo}</span>
    </div>
  )
}
