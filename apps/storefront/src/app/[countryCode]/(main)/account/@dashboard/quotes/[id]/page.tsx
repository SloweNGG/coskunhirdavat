import { retrieveQuote } from "@lib/data/quotes"
import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PriceText from "@modules/common/components/price-text"
import QuoteActions from "@modules/quotes/components/quote-actions"
import { QUOTE_STATUS } from "@modules/quotes/status"
import { Metadata } from "next"
import { notFound } from "next/navigation"

type Props = { params: Promise<{ id: string }> }

export const metadata: Metadata = { title: "Teklif detayı" }

export default async function QuoteDetail(props: Props) {
  const { id } = await props.params
  const quote = await retrieveQuote(id)
  if (!quote) {
    notFound()
  }

  const order = quote.draft_order
  const money = (amount: number) => (
    <PriceText value={convertToLocale({ amount, currency_code: order.currency_code })} />
  )
  const offered = new Map(quote.preview?.items.map((i) => [i.id, i]))
  // Show the store's prices once it has answered; before that, list prices.
  const answered = quote.status !== "pending_merchant"
  const status = QUOTE_STATUS[quote.status]

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <LocalizedClientLink href="/account/quotes" className="text-sm text-muted hover:text-navy">
          ← Tekliflerim
        </LocalizedClientLink>
        <div className="mt-2 flex items-center justify-between gap-4">
          <h1 className="text-2xl-semi">Teklif #{order.display_id}</h1>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${status.className}`}>
            {status.label}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted">
          {new Date(quote.created_at).toLocaleDateString("tr-TR")}
        </p>
      </div>

      {quote.status === "pending_merchant" && (
        <p className="rounded-2xl bg-soft p-4 text-sm text-navy">
          Talebiniz alındı. Fiyat teklifimizi hazırlayıp size bildireceğiz.
        </p>
      )}
      {quote.status === "accepted" && (
        <p className="rounded-2xl bg-green-50 p-4 text-sm text-green-800">
          Teklifi kabul ettiniz; siparişiniz oluşturuldu. Ödeme ve teslimat için
          sizinle iletişime geçeceğiz.{" "}
          <LocalizedClientLink href="/account/orders" className="font-semibold underline">
            Siparişlerim
          </LocalizedClientLink>
        </p>
      )}

      <div className="rounded-2xl border border-line bg-white">
        <ul className="divide-y divide-line">
          {order.items.map((item) => {
            const o = offered.get(item.id)
            const qty = answered && o ? o.quantity : item.quantity
            const unit = answered && o ? o.unit_price : item.unit_price
            const changed = answered && o && unit !== item.unit_price
            return (
              <li key={item.id} className="flex items-center gap-4 p-4">
                {item.thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.thumbnail} alt="" className="h-14 w-14 rounded-xl object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-navy">{item.title}</p>
                  {item.variant_title && (
                    <p className="text-sm text-muted">{item.variant_title}</p>
                  )}
                  <p className="text-sm text-muted">
                    {qty} adet × {money(unit)}
                    {changed && (
                      <span className="ml-2 line-through">{money(item.unit_price)}</span>
                    )}
                  </p>
                </div>
                <span className="font-semibold text-navy">{money(qty * unit)}</span>
              </li>
            )
          })}
        </ul>
        <div className="flex items-center justify-between border-t border-line p-4">
          <span className="text-muted">
            {answered ? "Teklif toplamı (KDV dahil)" : "Liste toplamı (KDV dahil)"}
          </span>
          <span className="text-lg font-bold text-navy">
            {money(answered ? quote.preview?.total ?? order.total : order.total)}
          </span>
        </div>
      </div>

      {quote.status === "pending_customer" && <QuoteActions id={quote.id} />}
    </div>
  )
}
