import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminOrder, DetailWidgetProps } from "@medusajs/framework/types"
import { Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { useState } from "react"

const OrderInvoiceWidget = ({ data: order }: DetailWidgetProps<AdminOrder>) => {
  const [loading, setLoading] = useState(false)

  const download = async () => {
    setLoading(true)
    try {
      // Same origin as the dashboard; the admin session cookie authenticates.
      const res = await fetch(`/admin/orders/${order.id}/invoice`, {
        credentials: "include",
      })
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }
      const url = URL.createObjectURL(await res.blob())
      const a = document.createElement("a")
      a.href = url
      a.download = `proforma-fatura-${order.display_id}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      toast.error(`Fatura oluşturulamadı: ${(e as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Fatura</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Proforma fatura (PDF). e-Fatura / e-Arşiv yerine geçmez.
        </Text>
      </div>
      <div className="flex justify-end px-6 py-4">
        <Button variant="secondary" size="small" isLoading={loading} onClick={download}>
          Faturayı indir
        </Button>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.before",
})

export default OrderInvoiceWidget
