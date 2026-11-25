import { Badge, Button, Container, Heading, Input, Table, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { api, formatMoney, Quote, STATUS_COLOR, STATUS_LABEL } from "../../../lib/quotes"

type Draft = Record<string, { quantity: number; unit_price: number }>

const QuoteDetailPage = () => {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ["quotes", id],
    queryFn: () => api<{ quote: Quote }>(`/admin/quotes/${id}`),
  })
  const quote = data?.quote
  const [draft, setDraft] = useState<Draft>({})

  // Start the form from the current offer (preview) values.
  useEffect(() => {
    if (!quote?.preview) {
      return
    }
    setDraft(
      Object.fromEntries(
        quote.preview.items.map((i) => [i.id, { quantity: i.quantity, unit_price: i.unit_price }])
      )
    )
  }, [quote])

  const onDone = (message: string) => {
    toast.success(message)
    queryClient.invalidateQueries({ queryKey: ["quotes"] })
  }
  const onError = (e: Error) => toast.error(e.message)

  const send = useMutation({
    mutationFn: () =>
      api(`/admin/quotes/${id}/send`, {
        method: "POST",
        body: JSON.stringify({
          items: Object.entries(draft).map(([itemId, v]) => ({ id: itemId, ...v })),
        }),
      }),
    onSuccess: () => onDone("Teklif müşteriye gönderildi."),
    onError,
  })
  const reject = useMutation({
    mutationFn: () => api(`/admin/quotes/${id}/reject`, { method: "POST" }),
    onSuccess: () => onDone("Teklif talebi reddedildi."),
    onError,
  })

  if (isLoading || !quote) {
    return <Container><Text>Yükleniyor...</Text></Container>
  }

  const order = quote.draft_order
  const currency = order?.currency_code ?? "try"
  const editable = quote.status === "pending_merchant"
  const canReject = editable || quote.status === "pending_customer"
  const offerTotal = Object.values(draft).reduce((s, v) => s + v.quantity * v.unit_price, 0)
  const set = (itemId: string, key: "quantity" | "unit_price", value: string) =>
    setDraft((d) => ({ ...d, [itemId]: { ...d[itemId], [key]: Number(value) || 0 } }))

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="flex items-start justify-between gap-4 px-6 py-4">
        <div>
          <Link to="/quotes" className="text-ui-fg-subtle txt-small">← Teklifler</Link>
          <Heading className="mt-1">Teklif #{order?.display_id}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {new Date(quote.created_at).toLocaleString("tr-TR")}
          </Text>
        </div>
        <Badge color={STATUS_COLOR[quote.status]}>{STATUS_LABEL[quote.status]}</Badge>
      </Container>

      <Container className="px-6 py-4">
        <Heading level="h2">Müşteri</Heading>
        <Text size="small" className="mt-2">
          {[quote.customer?.first_name, quote.customer?.last_name].filter(Boolean).join(" ")}
          {quote.customer?.company_name ? ` · ${quote.customer.company_name}` : ""}
        </Text>
        <Text size="small" className="text-ui-fg-subtle">
          {quote.customer?.email}
          {quote.customer?.phone ? ` · ${quote.customer.phone}` : ""}
        </Text>
      </Container>

      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Ürünler</Heading>
          {editable && (
            <Text size="small" className="text-ui-fg-subtle">
              Birim fiyatları (KDV dahil) ve adetleri değiştirip teklifi gönderin.
            </Text>
          )}
        </div>
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Ürün</Table.HeaderCell>
              <Table.HeaderCell>Liste fiyatı</Table.HeaderCell>
              <Table.HeaderCell>Talep adedi</Table.HeaderCell>
              <Table.HeaderCell>Teklif adedi</Table.HeaderCell>
              <Table.HeaderCell>Teklif birim fiyatı</Table.HeaderCell>
              <Table.HeaderCell>Satır toplamı</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {order?.items.map((item) => {
              const v = draft[item.id] ?? { quantity: item.quantity, unit_price: item.unit_price }
              return (
                <Table.Row key={item.id}>
                  <Table.Cell>
                    <div className="flex items-center gap-2 py-1">
                      {item.thumbnail && (
                        <img src={item.thumbnail} alt="" className="h-8 w-8 rounded object-cover" />
                      )}
                      <div>
                        <Text size="small" weight="plus">{item.title}</Text>
                        <Text size="xsmall" className="text-ui-fg-subtle">
                          {[item.variant_title, item.variant_sku].filter(Boolean).join(" · ")}
                        </Text>
                      </div>
                    </div>
                  </Table.Cell>
                  <Table.Cell>{formatMoney(item.unit_price, currency)}</Table.Cell>
                  <Table.Cell>{item.quantity}</Table.Cell>
                  <Table.Cell>
                    {editable ? (
                      <Input
                        type="number"
                        min={0}
                        size="small"
                        className="w-20"
                        aria-label={`${item.title} teklif adedi`}
                        value={v.quantity}
                        onChange={(e) => set(item.id, "quantity", e.target.value)}
                      />
                    ) : (
                      v.quantity
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    {editable ? (
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        size="small"
                        className="w-28"
                        aria-label={`${item.title} teklif birim fiyatı`}
                        value={v.unit_price}
                        onChange={(e) => set(item.id, "unit_price", e.target.value)}
                      />
                    ) : (
                      formatMoney(v.unit_price, currency)
                    )}
                  </Table.Cell>
                  <Table.Cell>{formatMoney(v.quantity * v.unit_price, currency)}</Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table>
        <div className="flex items-center justify-between px-6 py-4">
          <Text size="small" className="text-ui-fg-subtle">
            Liste toplamı: {formatMoney(order?.total ?? 0, currency)}
          </Text>
          <Text weight="plus">Teklif toplamı: {formatMoney(offerTotal, currency)}</Text>
        </div>
        {canReject && (
          <div className="flex justify-end gap-2 px-6 py-4">
            <Button
              variant="danger"
              size="small"
              isLoading={reject.isPending}
              onClick={() => {
                if (window.confirm("Teklif talebi reddedilsin mi?")) {
                  reject.mutate()
                }
              }}
            >
              Reddet
            </Button>
            {editable && (
              <Button size="small" isLoading={send.isPending} onClick={() => send.mutate()}>
                Teklifi gönder
              </Button>
            )}
          </div>
        )}
      </Container>
    </div>
  )
}

export default QuoteDetailPage
