"use client"
import { setAddresses } from "@lib/data/cart"
import useToggleState from "@lib/hooks/use-toggle-state"
import compareAddresses from "@lib/util/compare-addresses"
import { HttpTypes } from "@medusajs/types"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useActionState } from "react"
import Checkbox from "@modules/common/components/checkbox"
import { getInvoiceLines } from "@modules/order/components/invoice-details"
import BillingAddress from "../billing_address"
import ErrorMessage from "../error-message"
import InvoiceType from "../invoice-type"
import ShippingAddress from "../shipping-address"
import {
  formatPhoneDigits,
  localPhoneDigits,
} from "../shipping-address/phone-input"
import { SubmitButton } from "../submit-button"
import StepCard, { StepInfo } from "@modules/checkout/components/step-card"
import { CHECKOUT_CTA } from "@modules/checkout/components/cta-class"

/** "+905321234567" -> "+90 532 123 45 67"; anything else unchanged. */
const displayPhone = (phone?: string | null) => {
  if (!phone) return ""
  const digits = localPhoneDigits(phone)
  return phone.startsWith("+90") && digits.length === 10
    ? `+90 ${formatPhoneDigits(digits)}`
    : phone
}

const AddressLines = ({
  address,
  showCountry,
}: {
  address: HttpTypes.StoreCartAddress
  showCountry: boolean
}) => (
  <>
    <p className="font-semibold">
      {address.first_name} {address.last_name}
    </p>
    <p>
      {address.address_1} {address.address_2}
    </p>
    <p>
      {[address.postal_code, address.city, address.province]
        .filter(Boolean)
        .join(", ")}
    </p>
    {showCountry && <p>{address.country_code?.toUpperCase()}</p>}
  </>
)

const Addresses = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "address"

  const { state: sameAsBilling, toggle: toggleSameAsBilling } = useToggleState(
    cart?.shipping_address && cart?.billing_address
      ? compareAddresses(cart?.shipping_address, cart?.billing_address)
      : true
  )

  const handleEdit = () => {
    router.push(pathname + "?step=address")
  }

  const [message, formAction] = useActionState(setAddresses, null)

  // The Türkiye region has a single country, so "TR" adds nothing there.
  const showCountry = (cart?.region?.countries?.length ?? 0) > 1
  const invoiceLines = getInvoiceLines(cart?.metadata)

  return (
    <StepCard
      step={1}
      title="Adres"
      state={isOpen ? "active" : cart?.shipping_address ? "done" : "upcoming"}
      onEdit={!isOpen && cart?.shipping_address ? handleEdit : undefined}
      editTestId="edit-address-button"
    >
      {isOpen ? (
        <form action={formAction}>
          <ShippingAddress customer={customer} cart={cart} />

          <InvoiceType
            cart={cart}
            besideToggle={
              <Checkbox
                id="same_as_billing"
                label="Fatura adresim teslimat adresimle aynı"
                name="same_as_billing"
                checked={sameAsBilling}
                onChange={toggleSameAsBilling}
                data-testid="billing-address-checkbox"
              />
            }
          />
          {!sameAsBilling && (
            <div>
              <h3 className="mb-4 mt-8 text-lg font-semibold text-navy">
                Fatura Adresi
              </h3>
              <BillingAddress cart={cart} />
            </div>
          )}
          <SubmitButton
            className={`mt-7 ${CHECKOUT_CTA}`}
            data-testid="submit-address-button"
          >
            Teslimata devam et
          </SubmitButton>
          <ErrorMessage error={message} data-testid="address-error-message" />
        </form>
      ) : cart?.shipping_address ? (
        <div className="grid grid-cols-1 gap-5 xsmall:grid-cols-2">
          <StepInfo
            label="Teslimat adresi"
            data-testid="shipping-address-summary"
          >
            <AddressLines
              address={cart.shipping_address}
              showCountry={showCountry}
            />
          </StepInfo>

          <StepInfo label="İletişim" data-testid="shipping-contact-summary">
            <p>{displayPhone(cart.shipping_address.phone)}</p>
            <p>{cart.email}</p>
          </StepInfo>

          <StepInfo label="Fatura adresi" data-testid="billing-address-summary">
            {sameAsBilling || !cart.billing_address ? (
              <p>Teslimat adresiyle aynı</p>
            ) : (
              <AddressLines
                address={cart.billing_address}
                showCountry={showCountry}
              />
            )}
          </StepInfo>

          {invoiceLines && (
            <StepInfo label="Fatura türü" data-testid="invoice-summary">
              {invoiceLines.map((line, i) => (
                <p key={i} className={i === 0 ? "font-semibold" : undefined}>
                  {line}
                </p>
              ))}
            </StepInfo>
          )}
        </div>
      ) : null}
    </StepCard>
  )
}

export default Addresses
