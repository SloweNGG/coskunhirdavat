import { Metadata } from "next"

import { STORE_NAME } from "@lib/util/site"
import { PlaceholderNotice, PolicyPage } from "@modules/policies/templates"

export const dynamic = "force-static"
export const revalidate = 60

export const metadata: Metadata = {
  title: "Gizlilik Politikası",
  description: `${STORE_NAME} gizlilik politikası.`,
}

export default function PrivacyPage() {
  return (
    <PolicyPage title="Gizlilik Politikası">
      <PlaceholderNotice />
      <p>
        Kişisel verilerinizin nasıl işlendiğine dair bilgiler yakında bu
        sayfada yer alacaktır.
      </p>
    </PolicyPage>
  )
}
