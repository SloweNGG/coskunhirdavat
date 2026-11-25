import { HttpTypes } from "@medusajs/types"
import { MapPin, User } from "@medusajs/icons"
import Input from "@modules/common/components/input"
import React, { useState } from "react"
import CountrySelect from "../country-select"
import PhoneInput from "../shipping-address/phone-input"
import ProvinceDistrictSelect from "../shipping-address/province-district-select"

const BillingAddress = ({ cart }: { cart: HttpTypes.StoreCart | null }) => {
  const [formData, setFormData] = useState<Record<string, string>>({
    "billing_address.first_name": cart?.billing_address?.first_name || "",
    "billing_address.last_name": cart?.billing_address?.last_name || "",
    "billing_address.address_1": cart?.billing_address?.address_1 || "",
    "billing_address.city": cart?.billing_address?.city || "",
    "billing_address.country_code": cart?.billing_address?.country_code || "",
    "billing_address.province": cart?.billing_address?.province || "",
    "billing_address.phone": cart?.billing_address?.phone || "",
  })

  const countries = cart?.region?.countries
  // Single-country region (TR): no country choice to make, send it hidden.
  const singleCountry = countries?.length === 1 ? countries[0].iso_2 : undefined

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLInputElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Ad"
          name="billing_address.first_name"
          icon={<User />}
          placeholder="Adınız"
          autoComplete="given-name"
          value={formData["billing_address.first_name"]}
          onChange={handleChange}
          required
          data-testid="billing-first-name-input"
        />
        <Input
          label="Soyad"
          name="billing_address.last_name"
          icon={<User />}
          placeholder="Soyadınız"
          autoComplete="family-name"
          value={formData["billing_address.last_name"]}
          onChange={handleChange}
          required
          data-testid="billing-last-name-input"
        />
        <div className="col-span-2">
          <Input
            label="Adres"
            name="billing_address.address_1"
            icon={<MapPin />}
            placeholder="Mahalle, sokak, bina no, daire"
            autoComplete="street-address"
            value={formData["billing_address.address_1"]}
            onChange={handleChange}
            required
            data-testid="billing-address-input"
          />
        </div>
        {singleCountry ? (
          <input
            type="hidden"
            name="billing_address.country_code"
            value={formData["billing_address.country_code"] || singleCountry}
          />
        ) : (
          <CountrySelect
            name="billing_address.country_code"
            autoComplete="country"
            region={cart?.region}
            value={formData["billing_address.country_code"]}
            onChange={handleChange}
            required
            data-testid="billing-country-select"
          />
        )}
        <ProvinceDistrictSelect
          prefix="billing_address"
          province={formData["billing_address.province"]}
          city={formData["billing_address.city"]}
          onChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
        />
        <div className="col-span-2">
          <PhoneInput
            name="billing_address.phone"
            value={formData["billing_address.phone"]}
            onChange={(phone) =>
              setFormData((prev) => ({
                ...prev,
                "billing_address.phone": phone,
              }))
            }
            required
            data-testid="billing-phone-input"
          />
        </div>
      </div>
    </>
  )
}

export default BillingAddress
