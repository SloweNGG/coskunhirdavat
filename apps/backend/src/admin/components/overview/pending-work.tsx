import { CheckCircleSolid, ExclamationCircle } from "@medusajs/icons"
import { Badge, Table, Text } from "@medusajs/ui"
import { ReactNode, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  formatDaysAgo,
  formatMoney,
  formatMoneyRounded,
  formatNumber,
  PendingSummary,
} from "../../lib/overview"

const TRANSFERS_ID = "bekleyen-havaleler"
const LOW_STOCK_ID = "stoku-azalanlar"
const PREVIEW_ROWS = 5

/** "Show all" toggle under a list, plus a note when the server capped it. */
const ListFooter = ({
  shown,
  loaded,
  total,
  expanded,
  onToggle,
  more,
}: {
  shown: number
  loaded: number
  total: number
  expanded: boolean
  onToggle: () => void
  more?: ReactNode
}) => {
  if (total <= shown && loaded <= PREVIEW_ROWS) {
    return null
  }
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-6 py-3">
      {loaded > PREVIEW_ROWS && (
        <button type="button" className={actionClass} onClick={onToggle}>
          {expanded ? "Daha az göster" : `Tümünü göster (${formatNumber(Math.min(total, loaded))})`}
        </button>
      )}
      {expanded && total > loaded && (
        <Text size="small" className="text-ui-fg-muted">
          İlk {formatNumber(loaded)} tanesi gösteriliyor, toplam {formatNumber(total)}.
        </Text>
      )}
      {more}
    </div>
  )
}

const scrollTo = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })

type TileProps = {
  label: string
  count: number
  doneText: string
  action?: ReactNode
}

const Tile = ({ label, count, doneText, action }: TileProps) => (
  <div className="bg-ui-bg-base flex flex-col gap-y-1 px-6 py-4">
    <Text size="small" className="text-ui-fg-subtle">
      {label}
    </Text>
    <div className="flex items-center gap-x-2">
      {count > 0 ? (
        <ExclamationCircle className="text-ui-tag-orange-icon" />
      ) : (
        <CheckCircleSolid className="text-ui-tag-green-icon" />
      )}
      <span className="text-ui-fg-base text-2xl font-medium leading-8">
        {formatNumber(count)}
      </span>
    </div>
    {count > 0 ? (
      action
    ) : (
      <Text size="small" className="text-ui-fg-muted">
        {doneText}
      </Text>
    )}
  </div>
)

const actionClass = "txt-compact-small text-ui-fg-interactive hover:underline text-left"

/** Things waiting for the owner right now: counts first, then the lists. */
export const PendingWork = ({ data }: { data: PendingSummary }) => {
  const navigate = useNavigate()
  const [allTransfers, setAllTransfers] = useState(false)
  const [allStock, setAllStock] = useState(false)
  const transfers = data.bank_transfers
  const lowStock = data.low_stock
  const transferRows = allTransfers ? transfers.items : transfers.items.slice(0, PREVIEW_ROWS)
  const stockRows = allStock ? lowStock.items : lowStock.items.slice(0, PREVIEW_ROWS)

  return (
    <>
      <div className="grid grid-cols-1 gap-px bg-ui-border-base sm:grid-cols-2 xl:grid-cols-4">
        <Tile
          label="Havale/EFT ödemesi bekleyen sipariş"
          count={transfers.count}
          doneText="Bekleyen ödeme yok"
          action={
            <button type="button" className={actionClass} onClick={() => scrollTo(TRANSFERS_ID)}>
              {formatMoneyRounded(transfers.total)} tutarında · Listeyi gör
            </button>
          }
        />
        <Tile
          label="Yanıt bekleyen teklif"
          count={data.quotes.count}
          doneText="Hepsi yanıtlandı"
          action={
            <Link to="/quotes" className={actionClass}>
              Teklifleri aç
            </Link>
          }
        />
        <Tile
          label="Onay bekleyen yorum"
          count={data.reviews.count}
          doneText="Hepsi incelendi"
          action={
            <Link to="/reviews" className={actionClass}>
              Yorumları aç
            </Link>
          }
        />
        <Tile
          label={`Stoku biten veya azalan ürün çeşidi (${lowStock.threshold} adet ve altı)`}
          count={lowStock.count}
          doneText="Stoklar yeterli"
          action={
            <button type="button" className={actionClass} onClick={() => scrollTo(LOW_STOCK_ID)}>
              {lowStock.sold_out > 0 ? `${formatNumber(lowStock.sold_out)} tanesi tükendi · ` : ""}
              Listeyi gör
            </button>
          }
        />
      </div>

      {transfers.count > 0 && (
        <div id={TRANSFERS_ID} className="scroll-mt-4">
          <div className="px-6 pb-2 pt-4">
            <Text size="small" weight="plus">
              Ödemesi beklenen havaleler
            </Text>
            <Text size="small" className="text-ui-fg-subtle">
              Para hesabınıza geçince siparişi açın ve Ödeme bölümünde “Ödemeyi al” deyin.
            </Text>
          </div>
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Sipariş</Table.HeaderCell>
                <Table.HeaderCell>Müşteri</Table.HeaderCell>
                <Table.HeaderCell>Bekliyor</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Tutar</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {transferRows.map((t) => (
                <Table.Row
                  key={t.order_id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/orders/${t.order_id}`)}
                >
                  <Table.Cell>
                    <Link
                      to={`/orders/${t.order_id}`}
                      className="text-ui-fg-interactive hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      #{t.display_id}
                    </Link>
                  </Table.Cell>
                  <Table.Cell>{t.customer}</Table.Cell>
                  <Table.Cell>{formatDaysAgo(t.created_at)}</Table.Cell>
                  <Table.Cell className="text-right tabular-nums">
                    {formatMoney(t.amount, t.currency_code)}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
          <ListFooter
            shown={transferRows.length}
            loaded={transfers.items.length}
            total={transfers.count}
            expanded={allTransfers}
            onToggle={() => setAllTransfers((v) => !v)}
          />
        </div>
      )}

      {lowStock.count > 0 && (
        <div id={LOW_STOCK_ID} className="scroll-mt-4">
          <div className="px-6 pb-2 pt-4">
            <Text size="small" weight="plus">
              Stoku biten veya azalan ürünler
            </Text>
            <Text size="small" className="text-ui-fg-subtle">
              Satılabilir adedi {lowStock.threshold} veya daha az olanlar, en azdan başlayarak.
              Tükenenler sitede satın alınamaz; stok girmek için ürünü açın.
            </Text>
          </div>
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Ürün</Table.HeaderCell>
                <Table.HeaderCell>Seçenek</Table.HeaderCell>
                <Table.HeaderCell className="hidden sm:table-cell">Stok kodu</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Kalan</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {stockRows.map((i) => (
                <Table.Row key={i.inventory_item_id}>
                  <Table.Cell>
                    <Link
                      to={`/products/${i.product_id}`}
                      className="text-ui-fg-interactive hover:underline"
                    >
                      {i.product_title}
                    </Link>
                  </Table.Cell>
                  <Table.Cell>{i.variant_title ?? "-"}</Table.Cell>
                  <Table.Cell className="hidden sm:table-cell">{i.sku ?? "-"}</Table.Cell>
                  <Table.Cell className="text-right">
                    <Badge size="2xsmall" color={i.available <= 0 ? "red" : "orange"}>
                      {i.available <= 0 ? "Tükendi" : `${formatNumber(i.available)} adet`}
                    </Badge>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
          <ListFooter
            shown={stockRows.length}
            loaded={lowStock.items.length}
            total={lowStock.count}
            expanded={allStock}
            onToggle={() => setAllStock((v) => !v)}
            more={
              lowStock.count > lowStock.items.length ? (
                <Link to="/inventory" className={actionClass}>
                  Stok sayfasını aç
                </Link>
              ) : undefined
            }
          />
        </div>
      )}
    </>
  )
}
