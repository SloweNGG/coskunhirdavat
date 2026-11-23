import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChatBubbleLeftRight } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  Select,
  Table,
  Text,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

type Status = "pending" | "approved" | "rejected"

type Review = {
  id: string
  rating: number
  title: string | null
  content: string
  first_name: string
  last_name: string
  status: Status
  created_at: string
  product?: { id: string; title: string } | null
}

const PAGE_SIZE = 20

const STATUS_LABEL: Record<Status, string> = {
  pending: "Bekliyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
}

const STATUS_COLOR: Record<Status, "orange" | "green" | "red"> = {
  pending: "orange",
  approved: "green",
  rejected: "red",
}

const api = async <T,>(path: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  })
  if (!res.ok) {
    throw new Error((await res.json().catch(() => null))?.message || res.statusText)
  }
  return res.json()
}

const ReviewsPage = () => {
  const [status, setStatus] = useState<Status | "all">("pending")
  const [page, setPage] = useState(0)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reviews", status, page],
    queryFn: () =>
      api<{ reviews: Review[]; count: number }>(
        `/admin/reviews?limit=${PAGE_SIZE}&offset=${page * PAGE_SIZE}${
          status === "all" ? "" : `&status=${status}`
        }`
      ),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (body: { ids: string[]; status: Status }) =>
      api("/admin/reviews/status", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      toast.success("Yorum güncellendi")
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] })
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const count = data?.count ?? 0
  const pages = Math.max(Math.ceil(count / PAGE_SIZE), 1)

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>Yorumlar</Heading>
        <div className="w-44">
          <Select
            value={status}
            onValueChange={(v) => {
              setStatus(v as Status | "all")
              setPage(0)
            }}
          >
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="pending">Bekleyenler</Select.Item>
              <Select.Item value="approved">Onaylananlar</Select.Item>
              <Select.Item value="rejected">Reddedilenler</Select.Item>
              <Select.Item value="all">Tümü</Select.Item>
            </Select.Content>
          </Select>
        </div>
      </div>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Ürün</Table.HeaderCell>
            <Table.HeaderCell>Puan</Table.HeaderCell>
            <Table.HeaderCell>Yorum</Table.HeaderCell>
            <Table.HeaderCell>Müşteri</Table.HeaderCell>
            <Table.HeaderCell>Durum</Table.HeaderCell>
            <Table.HeaderCell />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {data?.reviews.map((review) => (
            <Table.Row key={review.id}>
              <Table.Cell>
                {review.product ? (
                  <a
                    href={`/app/products/${review.product.id}`}
                    className="text-ui-fg-interactive hover:underline"
                  >
                    {review.product.title}
                  </a>
                ) : (
                  "-"
                )}
              </Table.Cell>
              <Table.Cell>{"★".repeat(review.rating)}</Table.Cell>
              <Table.Cell className="max-w-md whitespace-normal py-2">
                {review.title && (
                  <Text size="small" weight="plus">
                    {review.title}
                  </Text>
                )}
                <Text size="small">{review.content}</Text>
              </Table.Cell>
              <Table.Cell>
                {review.first_name} {review.last_name}
              </Table.Cell>
              <Table.Cell>
                <Badge color={STATUS_COLOR[review.status]} size="2xsmall">
                  {STATUS_LABEL[review.status]}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                <div className="flex justify-end gap-2">
                  {review.status !== "approved" && (
                    <Button
                      size="small"
                      variant="secondary"
                      disabled={isPending}
                      onClick={() => mutate({ ids: [review.id], status: "approved" })}
                    >
                      Onayla
                    </Button>
                  )}
                  {review.status !== "rejected" && (
                    <Button
                      size="small"
                      variant="danger"
                      disabled={isPending}
                      onClick={() => mutate({ ids: [review.id], status: "rejected" })}
                    >
                      Reddet
                    </Button>
                  )}
                </div>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      {!isLoading && !data?.reviews.length && (
        <Text className="px-6 py-8 text-center text-ui-fg-subtle">Yorum yok.</Text>
      )}

      <Table.Pagination
        count={count}
        pageSize={PAGE_SIZE}
        pageIndex={page}
        pageCount={pages}
        canPreviousPage={page > 0}
        canNextPage={page < pages - 1}
        previousPage={() => setPage((p) => p - 1)}
        nextPage={() => setPage((p) => p + 1)}
        translations={{ of: "/", results: "yorum", pages: "sayfa", prev: "Önceki", next: "Sonraki" }}
      />
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Yorumlar",
  icon: ChatBubbleLeftRight,
})

export default ReviewsPage
