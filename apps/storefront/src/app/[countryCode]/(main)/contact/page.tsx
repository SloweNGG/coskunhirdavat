import { Metadata } from "next"

import { STORE_INFO } from "@lib/store-config"
import { PolicyPage } from "@modules/policies/templates"

export const dynamic = "force-static"
export const revalidate = 60

export const metadata: Metadata = {
  title: "İletişim",
  description: `${STORE_INFO.name} iletişim bilgileri.`,
}

export default function ContactPage() {
  return (
    <PolicyPage title="İletişim">
      <p>
        Siparişiniz, kargo veya iade ile ilgili sorularınız için müşteri
        hizmetlerimize ulaşabilirsiniz. Lütfen sipariş numaranızı belirtin.
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
        <dt className="text-ui-fg-subtle">Telefon</dt>
        <dd>
          <a href={STORE_INFO.phoneHref}>{STORE_INFO.phone}</a>
        </dd>
        <dt className="text-ui-fg-subtle">WhatsApp</dt>
        <dd>
          <a href={STORE_INFO.whatsappHref} target="_blank" rel="noreferrer">
            Bize yazın
          </a>
        </dd>
        <dt className="text-ui-fg-subtle">E-posta</dt>
        <dd>
          <a href={`mailto:${STORE_INFO.email}`}>{STORE_INFO.email}</a>
        </dd>
        <dt className="text-ui-fg-subtle">Adres</dt>
        <dd>{STORE_INFO.address}</dd>
        <dt className="text-ui-fg-subtle">Çalışma saatleri</dt>
        <dd>{STORE_INFO.workingHours}</dd>
      </dl>
    </PolicyPage>
  )
}
