import { clx } from "@modules/common/components/ui"

/** Read-only 5-star rating; partial stars via a clipped overlay. */
const Stars = ({ rating, className }: { rating: number; className?: string }) => (
  <span
    className={clx("relative inline-flex text-line", className)}
    role="img"
    aria-label={`5 üzerinden ${rating.toLocaleString("tr-TR")} puan`}
  >
    <span aria-hidden>★★★★★</span>
    <span
      aria-hidden
      className="absolute inset-0 overflow-hidden whitespace-nowrap text-amber-500"
      style={{ width: `${(rating / 5) * 100}%` }}
    >
      ★★★★★
    </span>
  </span>
)

export default Stars
