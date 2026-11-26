import { clx } from "@modules/common/components/ui"

/**
 * Turquoise radio dot. Only a picture: the surrounding Headless UI Radio /
 * Listbox option carries the role and the checked state.
 */
const Radio = ({
  checked,
  "data-testid": dataTestId,
}: {
  checked: boolean
  "data-testid"?: string
}) => (
  <span
    aria-hidden
    data-state={checked ? "checked" : "unchecked"}
    data-testid={dataTestId || "radio-button"}
    className={clx(
      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 bg-white transition-colors",
      checked ? "border-brand" : "border-navy/25"
    )}
  >
    {checked && <span className="h-2.5 w-2.5 rounded-full bg-brand" />}
  </span>
)

export default Radio
