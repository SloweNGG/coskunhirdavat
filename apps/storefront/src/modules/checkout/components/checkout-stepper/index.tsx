"use client"

import { CheckMini } from "@medusajs/icons"
import { clx } from "@modules/common/components/ui"
import { useSearchParams } from "next/navigation"
import { Fragment } from "react"

const STEPS = [
  { key: "address", label: "Adres" },
  { key: "delivery", label: "Teslimat" },
  { key: "payment", label: "Ödeme" },
  { key: "review", label: "Onay" },
]

/** Horizontal progress capsule: done steps get a turquoise check, the current one its number in navy. */
const CheckoutStepper = () => {
  const step = useSearchParams().get("step") ?? "address"
  const current = Math.max(
    0,
    STEPS.findIndex((s) => s.key === step)
  )

  return (
    <ol
      className="flex items-center gap-x-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-2.5 text-xs font-semibold xsmall:px-5 xsmall:text-sm"
      aria-label="Ödeme adımları"
    >
      {STEPS.map((s, i) => {
        const done = i < current
        const active = i === current
        return (
          <Fragment key={s.key}>
            {i > 0 && (
              <li
                aria-hidden
                className={clx(
                  "h-0.5 min-w-3 flex-1 rounded-full",
                  i <= current ? "bg-brand" : "bg-navy/15"
                )}
              />
            )}
            <li
              className={clx(
                "flex shrink-0 items-center gap-x-1.5",
                done || active ? "text-navy" : "text-navy/45"
              )}
              aria-current={active ? "step" : undefined}
            >
              <span
                className={clx(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                  done && "bg-brand text-brand-fg",
                  active && "bg-navy text-white",
                  !done &&
                    !active &&
                    "bg-white text-navy/40 ring-1 ring-inset ring-navy/15"
                )}
                aria-hidden
              >
                {done ? <CheckMini /> : i + 1}
              </span>
              <span
                className={active ? undefined : "sr-only xsmall:not-sr-only"}
              >
                {s.label}
              </span>
            </li>
          </Fragment>
        )
      })}
    </ol>
  )
}

export default CheckoutStepper
