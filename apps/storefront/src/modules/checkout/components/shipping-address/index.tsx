import { HttpTypes } from "@medusajs/types"
import { Envelope, MapPin, User } from "@medusajs/icons"
import { Container } from "@modules/common/components/ui"
import Checkbox from "@modules/common/components/checkbox"
import Input from "@modules/common/components/input"
import { mapKeys } from "lodash"
import React, { useEffect, useMemo, useState } from "react"
import AddressSelect from "../address-select"
import CountrySelect from "../country-select"
import PhoneInput from "./phone-input"
import ProvinceDistrictSelect from "./province-district-select"

const ShippingAddress = ({
  customer,
  cart,
}: {
  customer: HttpTypes.StoreCustomer | null
  cart: HttpTypes.StoreCart | null
}) => {
  const [formData, setFormData] = useState<Record<string, string>>({
    "shipping_address.first_name": cart?.shipping_address?.first_name || "",
    "shipping_address.last_name": cart?.shipping_address?.last_name || "",
    "shipping_address.address_1": cart?.shipping_address?.address_1 || "",
    "shipping_address.city": cart?.shipping_address?.city || "",
    "shipping_address.country_code": cart?.shipping_address?.country_code || "",
    "shipping_address.province": cart?.shipping_address?.province || "",
    "shipping_address.phone": cart?.shipping_address?.phone || "",
    email: cart?.email || "",
  })

  const [marketingOptIn, setMarketingOptIn] = useState(
    cart?.metadata?.marketing_opt_in === true
  )

  const countriesInRegion = useMemo(
    () => cart?.region?.countries?.map((c) => c.iso_2),
    [cart?.region]
  )
  // Single-country region (TR): no country choice to make, send it hidden.
  const singleCountry =
    countriesInRegion?.length === 1 ? countriesInRegion[0] : undefined

  // check if customer has saved addresses that are in the current region
  const addressesInRegion = useMemo(
    () =>
      customer?.addresses.filter(
        (a) => a.country_code && countriesInRegion?.includes(a.country_code)
      ),
    [customer?.addresses, countriesInRegion]
  )

  const setFormAddress = (
    address?: HttpTypes.StoreCartAddress,
    email?: string
  ) => {
    if (address) {
      setFormData((prevState: Record<string, string>) => ({
        ...prevState,
        "shipping_address.first_name": address?.first_name || "",
        "shipping_address.last_name": address?.last_name || "",
        "shipping_address.address_1": address?.address_1 || "",
        "shipping_address.city": address?.city || "",
        "shipping_address.country_code": address?.country_code || "",
        "shipping_address.province": address?.province || "",
        "shipping_address.phone": address?.phone || "",
      }))
    }

    if (email) {
      setFormData((prevState: Record<string, string>) => ({
        ...prevState,
        email: email,
      }))
    }
  }

  useEffect(() => {
    // Ensure cart is not null and has a shipping_address before setting form data
    if (cart && cart.shipping_address) {
      setFormAddress(cart?.shipping_address, cart?.email)
    }

    if (cart && !cart.email && customer?.email) {
      setFormAddress(undefined, customer.email)
    }
  }, [cart]) // Add cart as a dependency

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
      {customer && (addressesInRegion?.length || 0) > 0 && (
        <Container className="mb-6 flex flex-col gap-y-4 p-5">
          <p className="text-small-regular">
            {`Merhaba ${customer.first_name}, kayıtlı adreslerinizden birini kullanmak ister misiniz?`}
          </p>
          <AddressSelect
            addresses={customer.addresses}
            addressInput={
              mapKeys(formData, (_, key) =>
                key.replace("shipping_address.", "")
              ) as unknown as HttpTypes.StoreCartAddress
            }
            onSelect={setFormAddress}
          />
        </Container>
      )}
      <Input
        label="E-posta"
        name="email"
        icon={<Envelope />}
        placeholder="ornek@eposta.com"
        type="email"
        title="Geçerli bir e-posta adresi girin."
        autoComplete="email"
        value={formData.email}
        onChange={handleChange}
        required
        data-testid="shipping-email-input"
      />
      <div className="mt-3">
        <Checkbox
          id="marketing_opt_in"
          label="Beni haberlerden ve özel tekliflerden haberdar et"
          name="marketing_opt_in"
          checked={marketingOptIn}
          onChange={() => setMarketingOptIn((v) => !v)}
          data-testid="marketing-opt-in-checkbox"
        />
      </div>
      <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-5">
        <Input
          label="Ad"
          name="shipping_address.first_name"
          icon={<User />}
          placeholder="Adınız"
          autoComplete="given-name"
          value={formData["shipping_address.first_name"]}
          onChange={handleChange}
          required
          data-testid="shipping-first-name-input"
        />
        <Input
          label="Soyad"
          name="shipping_address.last_name"
          icon={<User />}
          placeholder="Soyadınız"
          autoComplete="family-name"
          value={formData["shipping_address.last_name"]}
          onChange={handleChange}
          required
          data-testid="shipping-last-name-input"
        />
        <div className="col-span-2">
          <Input
            label="Adres"
            name="shipping_address.address_1"
            icon={<MapPin />}
            placeholder="Mahalle, sokak, bina no, daire"
            autoComplete="street-address"
            value={formData["shipping_address.address_1"]}
            onChange={handleChange}
            required
            data-testid="shipping-address-input"
          />
        </div>
        {singleCountry ? (
          <input
            type="hidden"
            name="shipping_address.country_code"
            value={formData["shipping_address.country_code"] || singleCountry}
          />
        ) : (
          <div className="col-span-2">
            <CountrySelect
              name="shipping_address.country_code"
              autoComplete="country"
              region={cart?.region}
              value={formData["shipping_address.country_code"]}
              onChange={handleChange}
              required
              data-testid="shipping-country-select"
            />
          </div>
        )}
        <ProvinceDistrictSelect
          prefix="shipping_address"
          province={formData["shipping_address.province"]}
          city={formData["shipping_address.city"]}
          onChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
        />
        <div className="col-span-2">
          <PhoneInput
            name="shipping_address.phone"
            value={formData["shipping_address.phone"]}
            onChange={(phone) =>
              setFormData((prev) => ({
                ...prev,
                "shipping_address.phone": phone,
              }))
            }
            required
            data-testid="shipping-phone-input"
          />
        </div>
      </div>
    </>
  )
}

export default ShippingAddress
