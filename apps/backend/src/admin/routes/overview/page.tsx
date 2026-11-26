import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChartBar } from "@medusajs/icons"
import { Button, clx, Container, Heading, Select, Text } from "@medusajs/ui"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { DailySalesChart, DailySalesTable } from "../../components/overview/daily-sales-chart"
import { PaymentMethods } from "../../components/overview/payment-methods"
import { PendingWork } from "../../components/overview/pending-work"
import { StatTile } from "../../components/overview/stat-tile"
import { TopProducts } from "../../components/overview/top-products"
import {
  CHART_STYLE,
  fetchJson,
  formatMoneyRounded,
  formatNumber,
  PendingSummary,
  Period,
  SalesSummary,
} from "../../lib/overview"

const PERIODS: { value: Period; label: string; comparedTo: string }[] = [
  { value: 7, label: "Son 7 gün", comparedTo: "önceki 7 güne göre" },
  { value: 30, label: "Son 30 gün", comparedTo: "önceki 30 güne göre" },
  { value: 90, label: "Son 90 gün", comparedTo: "önceki 90 güne göre" },
]

const Message = ({ text, error }: { text: string; error?: boolean }) => (
  <Text
    size="small"
    className={clx("px-6 py-4", error ? "text-ui-fg-error" : "text-ui-fg-subtle")}
  >
    {text}
  </Text>
)

const OverviewPage = () => {
  const [days, setDays] = useState<Period>(30)
  const [view, setView] = useState<"chart" | "table">("chart")
  const period = PERIODS.find((p) => p.value === days)!

  const pending = useQuery({
    queryKey: ["overview", "pending"],
    queryFn: () => fetchJson<PendingSummary>("/admin/dashboard/pending"),
  })
  const sales = useQuery({
    queryKey: ["overview", "sales", days],
    queryFn: () => fetchJson<SalesSummary>(`/admin/dashboard/sales?days=${days}`),
    // Keep the previous numbers on screen (dimmed) while a new period loads.
    placeholderData: keepPreviousData,
  })

  const s = sales.data
  const currency = s?.currency_code ?? "try"

  return (
    <div className="overview-viz flex flex-col gap-y-3">
      <style>{CHART_STYLE}</style>

      <Container className="overflow-hidden p-0">
        <div className="border-ui-border-base border-b px-6 py-4">
          <Heading>Bekleyen işler</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Şu anda ilgilenmeniz gerekenler.
          </Text>
        </div>
        {pending.isLoading ? (
          <Message text="Yükleniyor..." />
        ) : pending.error ? (
          <Message error text={`Bekleyen işler alınamadı: ${pending.error.message}`} />
        ) : (
          pending.data && <PendingWork data={pending.data} />
        )}
      </Container>

      <Container className="overflow-hidden p-0">
        <div className="border-ui-border-base flex flex-wrap items-center justify-between gap-3 border-b px-6 py-4">
          <div>
            <Heading>Satışlar</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              İptal edilen siparişler hariç; tutarlara KDV ve kargo dahil.
            </Text>
          </div>
          <div className="w-40">
            <Select value={String(days)} onValueChange={(v) => setDays(Number(v) as Period)}>
              <Select.Trigger aria-label="Dönem">
                <Select.Value />
              </Select.Trigger>
              <Select.Content>
                {PERIODS.map((p) => (
                  <Select.Item key={p.value} value={String(p.value)}>
                    {p.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>
        </div>

        {sales.isLoading ? (
          <Message text="Yükleniyor..." />
        ) : sales.error && !s ? (
          <Message error text={`Satış bilgileri alınamadı: ${sales.error.message}`} />
        ) : (
          s && (
            <div
              className={clx(
                "transition-opacity",
                sales.isPlaceholderData && "pointer-events-none opacity-50"
              )}
            >
              <div className="grid grid-cols-1 gap-px bg-ui-border-base sm:grid-cols-2 xl:grid-cols-4">
                <StatTile
                  label="Satış tutarı"
                  value={formatMoneyRounded(s.current.revenue, currency)}
                  current={s.current.revenue}
                  previous={s.previous.revenue}
                  comparedTo={period.comparedTo}
                />
                <StatTile
                  label="Sipariş sayısı"
                  value={formatNumber(s.current.orders)}
                  current={s.current.orders}
                  previous={s.previous.orders}
                  comparedTo={period.comparedTo}
                />
                <StatTile
                  label="Ortalama sepet tutarı"
                  value={formatMoneyRounded(s.current.average, currency)}
                  current={s.current.average}
                  previous={s.previous.average}
                  comparedTo={period.comparedTo}
                />
                <StatTile
                  label="Yeni üye olan müşteri"
                  value={formatNumber(s.current.new_customers)}
                  current={s.current.new_customers}
                  previous={s.previous.new_customers}
                  comparedTo={period.comparedTo}
                />
              </div>

              <div className="border-ui-border-base border-t px-6 py-4">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Text size="small" weight="plus">
                      Günlük satışlar
                    </Text>
                    <Text size="small" className="text-ui-fg-subtle">
                      Her gün gelen siparişlerin toplam tutarı. Ayrıntı için çubukların üzerine
                      gelin.
                    </Text>
                  </div>
                  <div className="flex gap-x-1" role="group" aria-label="Görünüm">
                    {(["chart", "table"] as const).map((v) => (
                      <Button
                        key={v}
                        size="small"
                        variant={view === v ? "secondary" : "transparent"}
                        aria-pressed={view === v}
                        onClick={() => setView(v)}
                      >
                        {v === "chart" ? "Grafik" : "Tablo"}
                      </Button>
                    ))}
                  </div>
                </div>
                {s.current.orders === 0 ? (
                  <Text size="small" className="text-ui-fg-muted py-6">
                    Bu dönemde sipariş yok.
                  </Text>
                ) : view === "chart" ? (
                  <DailySalesChart data={s.daily} currency={currency} />
                ) : (
                  <DailySalesTable data={s.daily} currency={currency} />
                )}
              </div>
            </div>
          )
        )}
      </Container>

      {s && (
        <div
          className={clx(
            "grid grid-cols-1 gap-3 transition-opacity lg:grid-cols-2",
            sales.isPlaceholderData && "opacity-50"
          )}
        >
          <Container className="flex flex-col gap-y-4 px-6 py-4">
            <div>
              <Heading level="h2">En çok satan ürünler</Heading>
              <Text size="small" className="text-ui-fg-subtle">
                {period.label}, satılan adede göre ilk 5.
              </Text>
            </div>
            <TopProducts items={s.top_products} currency={currency} />
          </Container>
          <Container className="flex flex-col gap-y-4 px-6 py-4">
            <div>
              <Heading level="h2">Ödeme yöntemleri</Heading>
              <Text size="small" className="text-ui-fg-subtle">
                {period.label}, satış tutarına göre dağılım.
              </Text>
            </div>
            <PaymentMethods methods={s.payment_methods} currency={currency} />
          </Container>
        </div>
      )}
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Özet",
  icon: ChartBar,
  rank: 0,
})

export default OverviewPage
