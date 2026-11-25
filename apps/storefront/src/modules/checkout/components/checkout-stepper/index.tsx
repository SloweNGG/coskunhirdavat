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

/** Horizontal progress bar: done steps get a green check, the current one a dot. */
const CheckoutStepper = () => {
  const step = useSearchParams().get("step") ?? "address"
  const current = Math.max(
    0,
    STEPS.findIndex((s) => s.key === step)
  )

  return (
    <ol
      className="flex items-center gap-x-2 rounded-2xl bg-soft px-4 py-3 text-xs font-medium xsmall:text-sm"
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
                  "h-px min-w-3 flex-1",
                  i <= current ? "bg-emerald-600" : "bg-navy/15"
                )}
              />
            )}
            <li
              className={clx(
                "flex shrink-0 items-center gap-x-1.5",
                done || active ? "text-navy" : "text-navy/40"
              )}
              aria-current={active ? "step" : undefined}
            >
              {done ? (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <CheckMini />
                </span>
              ) : (
                <span
                  className={clx(
                    "flex h-5 w-5 items-center justify-center rounded-full border",
                    active ? "border-navy" : "border-navy/25"
                  )}
                >
                  {active && <span className="h-2 w-2 rounded-full bg-navy" />}
                </span>
              )}
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
