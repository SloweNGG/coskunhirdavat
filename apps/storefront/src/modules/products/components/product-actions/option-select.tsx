import { ArchiveBox, ShoppingBag } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@modules/common/components/ui"
import Package from "@modules/common/icons/package"
import Image from "next/image"
import React from "react"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (title: string, value: string) => void
  title: string
  name: string
  disabled: boolean
  /** value -> image url; when given, values are shown as picture swatches */
  images?: Record<string, string>
  "data-testid"?: string
}

const PACK_WORD = /koli|kutu|paket/i

/**
 * Icon for a pack-size word: Paket = bag, Kutu = lidded box, Koli = shipping
 * case. The bold part of the label wins ("1 Koli (10 Paket)" -> Koli), then
 * the part in brackets ("6 Adet (1 Koli)" -> Koli).
 */
const packIcon = (label: string, value: string) => {
  const word = (label.match(PACK_WORD) ?? value.match(PACK_WORD))?.[0]
  switch (word?.toLowerCase()) {
    case "koli":
      return <Package size="17" className="shrink-0" aria-hidden />
    case "kutu":
      return <ArchiveBox className="shrink-0" aria-hidden />
    case "paket":
      return <ShoppingBag className="shrink-0" aria-hidden />
    default:
      return null
  }
}

/**
 * "Paket (10 Adet)" -> bold "Paket" with a lighter "10 Adet" after it.
 * Values with a pack-size word (Paket, Kutu, Koli) start with its icon.
 */
const OptionLabel = ({ value }: { value: string }) => {
  const match = value.match(/^(.+?)\s*\((.+)\)$/)
  const icon = packIcon(match?.[1] ?? value, value)
  if (!match) {
    return (
      <>
        {icon}
        {value}
      </>
    )
  }

  return (
    <>
      {icon}
      {/* the space keeps screen readers from reading "Paket10 Adet" */}
      {match[1]}{" "}
      <span className="text-[13px] font-medium opacity-70">{match[2]}</span>
    </>
  )
}

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  name,
  images,
  "data-testid": dataTestId,
  disabled,
}) => {
  const filteredOptions = (option.values ?? []).map((v) => v.value)

  return (
    <fieldset className="flex flex-col gap-y-3" disabled={disabled}>
      <legend className="mb-3 text-[15px] font-semibold text-navy">
        {title}:{" "}
        <span className="font-bold text-brand-ink">{current ?? "Seçin"}</span>
      </legend>
      <div
        className={clx(
          images ? "grid grid-cols-4 gap-3" : "flex flex-wrap gap-2"
        )}
        data-testid={dataTestId}
      >
        {filteredOptions.map((v) => {
          const id = `${name}-${v}`.replace(/[^A-Za-z0-9_-]/g, "-")
          const selected = v === current
          return (
            <div key={v}>
              <input
                type="radio"
                id={id}
                name={name}
                value={v}
                checked={selected}
                onChange={() => updateOption(option.id, v)}
                className="peer sr-only"
              />
              <label
                htmlFor={id}
                title={v}
                className={clx(
                  "flex cursor-pointer items-center justify-center border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed",
                  images
                    ? "relative aspect-square overflow-hidden rounded-2xl bg-soft"
                    : "h-12 min-w-[72px] gap-x-1.5 rounded-full px-5 text-[15px] font-bold",
                  selected
                    ? clx(
                        "border-brand ring-1 ring-brand",
                        !images && "bg-brand-50 text-brand-ink"
                      )
                    : clx(
                        "border-line hover:border-navy/50",
                        !images && "bg-white text-navy"
                      )
                )}
                data-testid="option-button"
              >
                {images ? (
                  <>
                    <Image
                      src={images[v]}
                      alt=""
                      fill
                      sizes="96px"
                      className="object-contain p-1.5"
                    />
                    <span className="sr-only">{v}</span>
                  </>
                ) : (
                  <OptionLabel value={v} />
                )}
              </label>
            </div>
          )
        })}
      </div>
    </fieldset>
  )
}

export default OptionSelect
