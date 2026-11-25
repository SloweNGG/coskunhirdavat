import { CheckMini } from "@medusajs/icons"
import { clx } from "@modules/common/components/ui"

/** "1  Adres" style checkout step title; the number turns into a check when done. */
const StepTitle = ({
  step,
  title,
  done = false,
}: {
  step: number
  title: string
  done?: boolean
}) => (
  <span className="flex items-center gap-x-3">
    <span
      className={clx(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white",
        done ? "bg-emerald-600" : "bg-navy"
      )}
      aria-hidden
    >
      {done ? <CheckMini /> : step}
    </span>
    <span className="text-2xl font-semibold text-navy">{title}</span>
    {done && <span className="sr-only">(tamamlandı)</span>}
  </span>
)

export default StepTitle
