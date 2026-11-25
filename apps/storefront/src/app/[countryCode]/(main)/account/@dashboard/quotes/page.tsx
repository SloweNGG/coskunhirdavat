import { listQuotes } from "@lib/data/quotes"
import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import PriceText from "@modules/common/components/price-text"
import { QUOTE_STATUS } from "@modules/quotes/status"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Tekliflerim",
  description: "Toplu alım teklif talepleriniz.",
}

export default async function Quotes() {
  const quotes = await listQuotes()

  return (
    <div className="w-full">
      <div className="mb-8 flex flex-col gap-y-4">
        <h1 className="text-2xl-semi">Tekliflerim</h1>
        <p className="text-base-regular">
          Sepetinizden gönderdiğiniz toplu alım teklif talepleri. Fiyatımızı
          verdiğimizde buradan kabul edebilir veya reddedebilirsiniz.
        </p>
      </div>
      {!quotes.length ? (
        <div className="rounded-2xl border border-line bg-white p-6 text-muted">
          Henüz teklif talebiniz yok. Sepet sayfasındaki &quot;Toplu alım için
          teklif iste&quot; düğmesini kullanabilirsiniz.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {quotes.map((q) => {
            const status = QUOTE_STATUS[q.status]
            const total = q.preview?.total ?? q.draft_order.total
            return (
              <li key={q.id}>
                <LocalizedClientLink
                  href={`/account/quotes/${q.id}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-white p-5 hover:border-navy/40"
                >
                  <div>
                    <p className="font-semibold text-navy">
                      Teklif #{q.draft_order.display_id}
                    </p>
                    <p className="text-sm text-muted">
                      {new Date(q.created_at).toLocaleDateString("tr-TR")} ·{" "}
                      {q.draft_order.items.reduce((n, i) => n + i.quantity, 0)} ürün
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-semibold text-navy">
                      <PriceText
                        value={convertToLocale({
                          amount: total,
                          currency_code: q.draft_order.currency_code,
                        })}
                      />
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                </LocalizedClientLink>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
