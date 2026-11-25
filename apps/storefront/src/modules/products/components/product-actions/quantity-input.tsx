"use client"

import { Minus, Plus } from "@medusajs/icons"

type QuantityInputProps = {
  value: number
  onChange: (value: number) => void
  max?: number
  disabled?: boolean
  size?: "md" | "sm"
}

/** − [n] + stepper. Typing is allowed; the value is clamped to 1..max. */
const QuantityInput = ({
  value,
  onChange,
  max = 999,
  disabled,
  size = "md",
}: QuantityInputProps) => {
  const sm = size === "sm"
  const set = (n: number) => onChange(Math.min(Math.max(1, Math.floor(n) || 1), max))

  return (
    <div
      className={`flex ${sm ? "h-10" : "h-12"} shrink-0 items-center rounded-full border border-line bg-white px-1`}
    >
      <button
        type="button"
        onClick={() => set(value - 1)}
        disabled={disabled || value <= 1}
        aria-label="Adedi azalt"
        className={`flex ${sm ? "h-8 w-8" : "h-10 w-10"} items-center justify-center rounded-full text-navy hover:bg-soft disabled:text-navy/30`}
      >
        <Minus />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => set(Number(e.target.value))}
        aria-label="Adet"
        className={`h-6 ${sm ? "w-10 text-sm" : "w-12 text-base"} border-x border-line bg-transparent text-center font-semibold text-navy outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
      />
      <button
        type="button"
        onClick={() => set(value + 1)}
        disabled={disabled || value >= max}
        aria-label="Adedi artır"
        className={`flex ${sm ? "h-8 w-8" : "h-10 w-10"} items-center justify-center rounded-full text-navy hover:bg-soft disabled:text-navy/30`}
      >
        <Plus />
      </button>
    </div>
  )
}

export default QuantityInput
