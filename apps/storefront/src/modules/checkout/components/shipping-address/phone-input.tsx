/** Strips "+90" / leading "0" and non-digits: "+90 532 123 45 67" -> "5321234567". */
export const localPhoneDigits = (value?: string | null) => {
  let v = (value ?? "").trim()
  // stored values always carry the "+90" prefix; drop it before reading digits
  if (v.startsWith("+90")) v = v.slice(3)
  let d = v.replace(/\D/g, "")
  if (d.startsWith("90") && d.length > 10) d = d.slice(2)
  if (d.startsWith("0")) d = d.slice(1)
  return d.slice(0, 10)
}

/** "5321234567" -> "532 123 45 67" (groups of 3-3-2-2, as typed so far). */
export const formatPhoneDigits = (digits: string) =>
  [
    digits.slice(0, 3),
    digits.slice(3, 6),
    digits.slice(6, 8),
    digits.slice(8, 10),
  ]
    .filter(Boolean)
    .join(" ")

const TurkishFlag = () => (
  <svg
    viewBox="0 0 30 20"
    className="h-4 w-6 shrink-0 rounded-[2px]"
    aria-hidden
  >
    <rect width="30" height="20" fill="#E30A17" />
    <circle cx="11" cy="10" r="5" fill="#fff" />
    <circle cx="12.25" cy="10" r="4" fill="#E30A17" />
    <polygon
      fill="#fff"
      points="15.6,10 17.6,9.35 17.6,7.25 18.85,8.95 20.85,8.3 19.6,10 20.85,11.7 18.85,11.05 17.6,12.75 17.6,10.65"
    />
  </svg>
)

/**
 * Turkish phone field: shows a +90 prefix, the shopper types 10 digits and the
 * hidden input submits "+90XXXXXXXXXX".
 */
const PhoneInput = ({
  name,
  value,
  onChange,
  required,
  optional,
  "data-testid": dataTestId,
}: {
  name: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  /** adds a muted "(isteğe bağlı)" after the label */
  optional?: boolean
  "data-testid"?: string
}) => {
  const digits = localPhoneDigits(value)

  return (
    <div className="flex w-full flex-col gap-y-1.5">
      <label
        htmlFor={`${name}-local`}
        className="text-sm font-medium text-navy"
      >
        Telefon{required && <span className="text-rose-500">*</span>}
        {optional && (
          <span className="ml-1 font-normal text-muted">(isteğe bağlı)</span>
        )}
      </label>
      <div className="flex h-11 items-center gap-x-3 rounded-xl border border-transparent bg-soft px-4 transition-colors focus-within:border-navy/25 focus-within:bg-white hover:bg-grey-10">
        <TurkishFlag />
        <span className="text-[15px] font-medium text-navy">+90</span>
        <span className="h-4 w-px shrink-0 bg-navy/15" aria-hidden />
        <input
          id={`${name}-local`}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="5XX XXX XX XX"
          pattern="\d{3} \d{3} \d{2} \d{2}"
          maxLength={13}
          title="Telefon numarasını başında 0 olmadan, 10 hane olarak girin."
          required={required}
          value={formatPhoneDigits(digits)}
          onChange={(e) => {
            const d = localPhoneDigits(e.target.value)
            onChange(d ? `+90${d}` : "")
          }}
          className="h-full w-full bg-transparent text-[15px] text-navy outline-none placeholder:text-navy/35"
          data-testid={dataTestId}
        />
      </div>
      <input type="hidden" name={name} value={digits ? `+90${digits}` : ""} />
    </div>
  )
}

export default PhoneInput
