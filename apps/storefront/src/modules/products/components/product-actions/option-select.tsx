import { HttpTypes } from "@medusajs/types"
import { clx } from "@modules/common/components/ui"
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
      <legend className="mb-3 text-sm text-muted">
        {title}:{" "}
        <span className="font-semibold text-navy">{current ?? "Seçin"}</span>
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
                  "flex cursor-pointer items-center justify-center border bg-white text-sm text-navy transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed",
                  images
                    ? "relative aspect-square overflow-hidden rounded-2xl bg-soft"
                    : "h-11 min-w-[64px] rounded-full px-5",
                  selected
                    ? "border-brand ring-1 ring-brand"
                    : "border-line hover:border-navy/40"
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
                  v
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
