import React from "react"

import UnderlineLink from "@modules/common/components/interactive-link"
import { clx } from "@modules/common/components/ui"

import AccountNav from "../components/account-nav"
import { HttpTypes } from "@medusajs/types"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

/**
 * Signed in: side nav + page, with a help band below. Signed out: just the
 * sign-in / register card, centred (it carries its own help link).
 */
const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {
  return (
    <div
      className={clx("flex-1", customer && "small:py-12")}
      data-testid="account-page"
    >
      <div
        className={clx(
          "flex-1 content-container h-full mx-auto bg-white flex flex-col",
          // signed out: a little wider so the register form can pair fields
          customer ? "max-w-5xl" : "max-w-6xl"
        )}
      >
        <div
          className={clx(
            "grid grid-cols-1",
            customer ? "py-12 small:grid-cols-[240px_1fr]" : "py-6"
          )}
        >
          {customer && (
            <div>
              <AccountNav customer={customer} />
            </div>
          )}
          <div className="flex-1">{children}</div>
        </div>
        {customer && (
          <div className="flex flex-col small:flex-row items-end justify-between small:border-t border-gray-200 py-12 gap-8">
            <div>
              <h3 className="text-xl-semi mb-4">Sorunuz mu var?</h3>
              <span className="txt-medium">
                Sıkça sorulan sorular ve yanıtlarını müşteri hizmetleri
                sayfamızda bulabilirsiniz.
              </span>
            </div>
            <div>
              <UnderlineLink href="/contact">Müşteri Hizmetleri</UnderlineLink>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AccountLayout
