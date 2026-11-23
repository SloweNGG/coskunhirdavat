import { Metadata } from "next"

import { getStorePolicies } from "@lib/data/store-policies"
import {
  PlaceholderNotice,
  PoliciesUnavailable,
  PolicyPage,
  ShippingSummary,
} from "@modules/policies/templates"

export const dynamic = "force-static"
export const revalidate = 60

export const metadata: Metadata = {
  title: "Kargo ve Teslimat",
  description: "Kargo ücretleri ve teslimat süreleri.",
}

export default async function ShippingPage(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const { current, currencyCode } = await getStorePolicies(countryCode)

  return (
    <PolicyPage title="Kargo ve Teslimat">
      <PlaceholderNotice />
      {current ? (
        <>
          <p>
            {countryCode.toUpperCase()} adreslerine gönderilen siparişler için
            kargo ücreti ve teslimat süreleri aşağıdadır.
          </p>
          <ShippingSummary policies={current} currencyCode={currencyCode} />
          <p className="text-ui-fg-subtle">
            Kullanılabilir kargo seçenekleri ve kesin ücretler ödeme adımında gösterilir.
          </p>
        </>
      ) : (
        <PoliciesUnavailable />
      )}
    </PolicyPage>
  )
}
