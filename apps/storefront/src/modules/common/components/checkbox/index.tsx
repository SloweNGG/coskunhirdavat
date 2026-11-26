import React from "react"

type CheckboxProps = {
  checked?: boolean
  onChange?: () => void
  label: string
  name?: string
  id?: string
  "data-testid"?: string
}

/**
 * Native checkbox in the store's turquoise (same look as the contract
 * consent box at checkout). Inside a form it submits "on" when ticked.
 */
const CheckboxWithLabel: React.FC<CheckboxProps> = ({
  checked = true,
  onChange,
  label,
  name,
  id = "checkbox",
  "data-testid": dataTestId,
}) => {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-x-2.5 text-sm text-navy"
    >
      <input
        type="checkbox"
        id={id}
        name={name}
        checked={checked}
        onChange={() => onChange?.()}
        className="h-[18px] w-[18px] shrink-0 cursor-pointer accent-brand"
        data-testid={dataTestId}
      />
      {label}
    </label>
  )
}

export default CheckboxWithLabel
