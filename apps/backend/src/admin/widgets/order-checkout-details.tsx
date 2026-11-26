import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminOrder, DetailWidgetProps } from "@medusajs/framework/types"
import { Badge, Container, Heading, Text } from "@medusajs/ui"
import { ReactNode } from "react"

const BANK_TRANSFER = "pp_system_default"

const PAYMENT_LABELS: Record<string, string> = {
  [BANK_TRANSFER]: "Havale / EFT",
  pp_paytr_paytr: "Kredi kartı (PayTR)",
}

type InvoiceMeta = {
  type?: "individual" | "corporate"
  company_name?: string
  tax_office?: string
  tax_number?: string
  tc_number?: string
}

const Row = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="text-ui-fg-subtle grid grid-cols-2 items-start gap-x-3 px-6 py-3">
    <Text size="small" weight="plus" leading="compact">
      {title}
    </Text>
    <div className="txt-compact-small whitespace-pre-line break-words">{children}</div>
  </div>
)

/**
 * Shows what the customer entered at checkout (invoice type, tax details,
 * order note, e-mail consent) in plain Turkish instead of raw metadata, and
 * whether a bank transfer is still waiting to be marked as received.
 */
const OrderCheckoutDetailsWidget = ({ data: order }: DetailWidgetProps<AdminOrder>) => {
  const meta = (order.metadata ?? {}) as Record<string, unknown>
  const invoice = (meta.invoice ?? {}) as InvoiceMeta
  const note = typeof meta.order_note === "string" ? meta.order_note.trim() : ""
  const optIn = meta.marketing_opt_in

  const collection =
    order.payment_collections?.find((c) => c.status !== "canceled") ??
    order.payment_collections?.[0]
  const providerId = collection?.payments?.[0]?.provider_id
  const awaitingTransfer =
    providerId === BANK_TRANSFER &&
    (collection?.status === "authorized" || collection?.status === "partially_authorized")

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Sipariş bilgileri</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Müşterinin ödeme sayfasında girdikleri.
        </Text>
      </div>

      <Row title="Ödeme yöntemi">
        <div className="flex flex-wrap items-center gap-1">
          <span>{providerId ? PAYMENT_LABELS[providerId] ?? providerId : "-"}</span>
          {awaitingTransfer && (
            <Badge size="2xsmall" color="orange">
              Para bekleniyor
            </Badge>
          )}
          {providerId === BANK_TRANSFER && collection?.status === "completed" && (
            <Badge size="2xsmall" color="green">
              Para alındı
            </Badge>
          )}
        </div>
      </Row>

      {awaitingTransfer && (
        <div className="bg-ui-bg-subtle px-6 py-3">
          <Text size="small" className="text-ui-fg-subtle">
            Havale hesabınıza geçince Ödeme bölümünde “Ödemeyi al” deyin. Açıklamada sipariş
            numarası #{order.display_id} yazıyor olmalı.
          </Text>
        </div>
      )}

      <Row title="Fatura türü">
        {invoice.type === "corporate" ? "Kurumsal" : invoice.type === "individual" ? "Bireysel" : "-"}
      </Row>
      {invoice.type === "corporate" && (
        <>
          <Row title="Firma ünvanı">{invoice.company_name || "-"}</Row>
          <Row title="Vergi dairesi">{invoice.tax_office || "-"}</Row>
          <Row title="Vergi no">{invoice.tax_number || "-"}</Row>
        </>
      )}
      {invoice.type !== "corporate" && invoice.tc_number && (
        <Row title="TC kimlik no">{invoice.tc_number}</Row>
      )}

      <Row title="Sipariş notu">{note || "-"}</Row>
      <Row title="Kampanya e-postası">
        {optIn === true ? "İstiyor" : optIn === false ? "İstemiyor" : "-"}
      </Row>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side",
})

export default OrderCheckoutDetailsWidget
