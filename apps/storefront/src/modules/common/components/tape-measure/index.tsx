import { clx } from "@modules/common/components/ui"

/**
 * Signature tape-measure strip. `variant="band"` is a brand-colored tape with
 * dark ticks; `variant="ruler"` is a thin gray ruler line.
 */
const TapeMeasure = ({
  variant = "ruler",
  className,
}: {
  variant?: "band" | "ruler"
  className?: string
}) => {
  if (variant === "band") {
    return (
      <div aria-hidden className={clx("relative h-4 w-full bg-brand", className)}>
        <div className="tape-ticks absolute inset-x-0 top-0 h-full rotate-180 text-navy/60" />
      </div>
    )
  }

  return (
    <div
      aria-hidden
      className={clx("tape-ticks h-[13px] w-full text-navy/15", className)}
    />
  )
}

export default TapeMeasure
