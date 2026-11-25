import { defineRouteConfig } from "@medusajs/admin-sdk"
import { DocumentText } from "@medusajs/icons"
import { Badge, Container, Heading, Table, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { api, formatMoney, Quote, STATUS_COLOR, STATUS_LABEL } from "../../lib/quotes"

const QuotesPage = () => {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ["quotes"],
    queryFn: () => api<{ quotes: Quote[] }>("/admin/quotes"),
  })
  const quotes = data?.quotes ?? []

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading>Teklifler</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Müşterilerin sepetten gönderdiği toplu alım teklif talepleri.
        </Text>
      </div>
      {isLoading ? (
        <Text className="px-6 py-4">Yükleniyor...</Text>
      ) : !quotes.length ? (
        <Text className="px-6 py-4 text-ui-fg-subtle">Henüz teklif talebi yok.</Text>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Tarih</Table.HeaderCell>
              <Table.HeaderCell>Müşteri</Table.HeaderCell>
              <Table.HeaderCell>Ürün</Table.HeaderCell>
              <Table.HeaderCell>Tutar</Table.HeaderCell>
              <Table.HeaderCell>Durum</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {quotes.map((q) => (
              <Table.Row
                key={q.id}
                className="cursor-pointer"
                onClick={() => navigate(`/quotes/${q.id}`)}
              >
                <Table.Cell>{new Date(q.created_at).toLocaleDateString("tr-TR")}</Table.Cell>
                <Table.Cell>
                  {q.customer?.company_name ||
                    [q.customer?.first_name, q.customer?.last_name].filter(Boolean).join(" ") ||
                    q.customer?.email}
                </Table.Cell>
                <Table.Cell>
                  {q.draft_order?.items.reduce((n, i) => n + i.quantity, 0) ?? 0} adet
                </Table.Cell>
                <Table.Cell>
                  {formatMoney(q.draft_order?.total ?? 0, q.draft_order?.currency_code)}
                </Table.Cell>
                <Table.Cell>
                  <Badge size="2xsmall" color={STATUS_COLOR[q.status]}>
                    {STATUS_LABEL[q.status]}
                  </Badge>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Teklifler",
  icon: DocumentText,
})

export default QuotesPage
