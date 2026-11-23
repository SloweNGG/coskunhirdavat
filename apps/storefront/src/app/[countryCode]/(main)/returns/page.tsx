import { Metadata } from "next"

import { getStorePolicies } from "@lib/data/store-policies"
import {
  PlaceholderNotice,
  PoliciesUnavailable,
  PolicyPage,
} from "@modules/policies/templates"

export const dynamic = "force-static"
export const revalidate = 60

export const metadata: Metadata = {
  title: "İade Koşulları",
  description: "Ürün iadesi ve para iadesi hakkında bilgiler.",
}

export default async function ReturnsPage(props: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await props.params
  const { current } = await getStorePolicies(countryCode)

  return (
    <PolicyPage title="İade Koşulları">
      <PlaceholderNotice />
      {current ? (
        <>
          <p>
            Ürünleri teslimattan itibaren {current.returnWindowDays} gün
            içinde kargo ile iade edebilirsiniz.
          </p>
          <p>
            {current.freeReturns
              ? "İade kargosu ücretsizdir."
              : "İade kargo ücreti müşteriye aittir."}
          </p>
        </>
      ) : (
        <PoliciesUnavailable />
      )}
    </PolicyPage>
  )
}
