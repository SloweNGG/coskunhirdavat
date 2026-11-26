import { ArrowLeft, LockClosedSolid, Phone } from "@medusajs/icons"
import { STORE_INFO } from "@lib/store-config"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Logo from "@modules/layout/components/logo"

/**
 * Checkout gets a quiet version of the store header: logo, a "secure
 * payment" badge, the phone number and a way back to the cart. No search or
 * category bar, so nothing pulls the shopper away from paying.
 */
export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full bg-white relative small:min-h-screen">
      <header className="border-b border-line bg-white">
        <nav className="content-container flex h-16 items-center justify-between gap-x-4 small:h-20">
          <Logo />
          <div className="flex items-center gap-x-3 small:gap-x-6">
            <a
              href={STORE_INFO.phoneHref}
              className="hidden items-center gap-x-1.5 text-sm font-semibold text-navy/70 hover:text-navy medium:flex"
            >
              <Phone className="text-brand-ink" aria-hidden />
              {STORE_INFO.phone}
            </a>
            <span className="hidden items-center gap-x-1.5 rounded-full bg-brand-50 px-3.5 py-2 text-sm font-semibold text-brand-ink ring-1 ring-inset ring-brand-100 xsmall:flex">
              <LockClosedSolid aria-hidden />
              Güvenli ödeme
            </span>
            <LocalizedClientLink
              href="/cart"
              className="flex items-center gap-x-1.5 text-sm font-semibold text-navy hover:text-brand-ink"
              data-testid="back-to-cart-link"
            >
              <ArrowLeft aria-hidden />
              Sepete dön
            </LocalizedClientLink>
          </div>
        </nav>
      </header>
      <div className="relative" data-testid="checkout-container">
        {children}
      </div>
    </div>
  )
}
