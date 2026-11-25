import { CheckCircleSolid, TruckFast } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { FREE_SHIPPING_THRESHOLD } from "@lib/store-config"
import { convertToLocale } from "@lib/util/money"

const CONFETTI_COLORS = ["#059669", "#0c8599", "#f59f00", "#c4301c", "#3bc9db"]

/** One-shot CSS confetti burst; plays once when mounted. */
const Confetti = () => (
  <span
    aria-hidden
    className="pointer-events-none absolute inset-0 overflow-visible motion-reduce:hidden"
  >
    {Array.from({ length: 28 }, (_, i) => {
      // deterministic spread so server and client render the same markup
      const angle = (i / 28) * Math.PI * 2
      const dist = 60 + ((i * 37) % 70)
      return (
        <span
          key={i}
          className="fs-confetti"
          style={
            {
              left: `${8 + ((i * 29) % 84)}%`,
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              "--x": `${Math.round(Math.cos(angle) * dist)}px`,
              "--y": `${Math.round(Math.sin(angle) * dist * 0.6 - 50)}px`,
              "--r": `${(i * 47) % 360}deg`,
              animationDelay: `${(i % 7) * 30}ms`,
            } as React.CSSProperties
          }
        />
      )
    })}
  </span>
)

/** Progress toward free shipping, based on the tax-inclusive item total. */
const FreeShippingBar = ({
  cart,
  celebrate = false,
}: {
  cart: HttpTypes.StoreCart
  /** play a confetti burst when the threshold is reached (cart page) */
  celebrate?: boolean
}) => {
  const itemTotal = cart.item_total ?? 0
  const remaining = FREE_SHIPPING_THRESHOLD - itemTotal
  const reached = remaining <= 0
  const percent = reached
    ? 100
    : Math.round((itemTotal / FREE_SHIPPING_THRESHOLD) * 100)

  return (
    <div className="relative flex flex-col gap-y-2 text-sm text-navy">
      {reached ? (
        <p className="fs-pop flex items-center gap-x-2 font-semibold text-emerald-700">
          <CheckCircleSolid aria-hidden />
          Tebrikler! Kargonuz ücretsiz.
        </p>
      ) : (
        <p className="flex items-center gap-x-2">
          <TruckFast className="text-emerald-600" aria-hidden />
          <span>
            Ücretsiz kargo için sepetinize{" "}
            <span className="font-semibold">
              {convertToLocale({
                amount: remaining,
                currency_code: cart.currency_code,
              })}
            </span>{" "}
            değerinde ürün ekleyin
          </span>
        </p>
      )}
      <div
        role="progressbar"
        aria-label="Ücretsiz kargo ilerlemesi"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-2 w-full overflow-hidden rounded-full bg-soft"
      >
        <div
          className="fs-fill h-full rounded-full bg-emerald-600 transition-[width] duration-700 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
      {reached && celebrate && <Confetti />}
    </div>
  )
}

export default FreeShippingBar
