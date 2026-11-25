import { Metadata } from "next"

import { STORE_NAME } from "@lib/util/site"
import { PlaceholderNotice, PolicyPage } from "@modules/policies/templates"

export const dynamic = "force-static"
export const revalidate = 60

export const metadata: Metadata = {
  title: "Kullanım Koşulları",
  description: `${STORE_NAME} kullanım koşulları.`,
}

export default function TermsPage() {
  return (
    <PolicyPage title="Kullanım Koşulları">
      <PlaceholderNotice />
      <p>
        {STORE_NAME} üzerinden yapılan alışverişlere ilişkin koşullar yakında
        bu sayfada yer alacaktır.
      </p>
    </PolicyPage>
  )
}
