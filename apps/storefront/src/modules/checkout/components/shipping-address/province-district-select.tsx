import NativeSelect from "@modules/common/components/native-select"
import { TR_LOCATIONS, TR_PROVINCES } from "@lib/tr-locations"

// İl -> Medusa `province`, ilçe -> Medusa `city`.
const ProvinceDistrictSelect = ({
  prefix,
  province,
  city,
  onChange,
}: {
  prefix: "shipping_address" | "billing_address"
  province: string
  city: string
  onChange: (patch: Record<string, string>) => void
}) => {
  // Saved values not in the official list (old free-text input) are treated as empty so the user re-selects.
  const districts = TR_LOCATIONS[province]
  const il = districts ? province : ""
  const ilce = districts?.includes(city) ? city : ""

  const label = (text: string, htmlFor: string) => (
    <label htmlFor={htmlFor} className="text-sm font-medium text-navy">
      {text}
      <span className="text-rose-500">*</span>
    </label>
  )

  return (
    <>
      <div className="flex flex-col gap-y-1.5">
        {label("İl", `${prefix}.province`)}
        <NativeSelect
          id={`${prefix}.province`}
          name={`${prefix}.province`}
          aria-label="İl"
          placeholder="İl seçin"
          autoComplete="address-level1"
          value={il}
          onChange={(e) =>
            onChange({
              [`${prefix}.province`]: e.target.value,
              [`${prefix}.city`]: "",
            })
          }
          required
          data-testid={`${prefix.split("_")[0]}-province-select`}
        >
          {TR_PROVINCES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-col gap-y-1.5">
        {label("İlçe", `${prefix}.city`)}
        <NativeSelect
          id={`${prefix}.city`}
          name={`${prefix}.city`}
          aria-label="İlçe"
          placeholder={il ? "İlçe seçin" : "Önce il seçin"}
          autoComplete="address-level2"
          value={ilce}
          onChange={(e) => onChange({ [`${prefix}.city`]: e.target.value })}
          disabled={!il}
          required
          data-testid={`${prefix.split("_")[0]}-city-select`}
        >
          {districts?.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </NativeSelect>
      </div>
    </>
  )
}

export default ProvinceDistrictSelect
