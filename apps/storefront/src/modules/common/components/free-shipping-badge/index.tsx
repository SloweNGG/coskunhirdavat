import { TruckFast } from "@medusajs/icons"
import { FREE_SHIPPING_THRESHOLD } from "@lib/store-config"
import { clx } from "@modules/common/components/ui"

/** True when this price alone qualifies the order for free shipping. */
export const qualifiesForFreeShipping = (price?: number | null) =>
  typeof price === "number" && price >= FREE_SHIPPING_THRESHOLD

/** Green "Kargo Bedava" pill for products at or above the threshold. */
const FreeShippingBadge = ({
  size = "md",
  className,
}: {
  size?: "sm" | "md"
  className?: string
}) => (
  <span
    className={clx(
      "inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-600 font-bold uppercase tracking-wide text-white",
      size === "sm" ? "px-2 py-1 text-[10px]" : "px-3 py-1.5 text-xs",
      className
    )}
  >
    <TruckFast className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
    Kargo Bedava
  </span>
)

export default FreeShippingBadge
