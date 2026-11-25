import { HttpTypes } from "@medusajs/types"
import { Text } from "@modules/common/components/ui"

type OrderDetailsProps = {
  order: HttpTypes.StoreOrder
  showStatus?: boolean
}

const OrderDetails = ({ order, showStatus }: OrderDetailsProps) => {
  const statusLabels: Record<string, string> = {
    not_fulfilled: "Hazırlanıyor",
    partially_fulfilled: "Kısmen hazırlandı",
    fulfilled: "Hazırlandı",
    partially_shipped: "Kısmen kargoya verildi",
    shipped: "Kargoya verildi",
    partially_delivered: "Kısmen teslim edildi",
    delivered: "Teslim edildi",
    canceled: "İptal edildi",
    not_paid: "Ödenmedi",
    awaiting: "Ödeme bekleniyor",
    authorized: "Onaylandı",
    partially_authorized: "Kısmen onaylandı",
    captured: "Ödendi",
    partially_captured: "Kısmen ödendi",
    partially_refunded: "Kısmen iade edildi",
    refunded: "İade edildi",
    requires_action: "İşlem gerekiyor",
  }

  const formatStatus = (str: string) => {
    if (statusLabels[str]) return statusLabels[str]
    const formatted = str.split("_").join(" ")

    return formatted.slice(0, 1).toUpperCase() + formatted.slice(1)
  }

  return (
    <div>
      <Text>
        Sipariş onay bilgilerini şu adrese gönderdik:{" "}
        <span
          className="text-ui-fg-medium-plus font-semibold"
          data-testid="order-email"
        >
          {order.email}
        </span>
        .
      </Text>
      <Text className="mt-2">
        Sipariş tarihi:{" "}
        <span data-testid="order-date">
          {new Date(order.created_at).toLocaleDateString("tr-TR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
      </Text>
      <Text className="mt-2 text-ui-fg-interactive">
        Sipariş numarası: <span data-testid="order-id">{order.display_id}</span>
      </Text>

      <div className="flex items-center text-compact-small gap-x-4 mt-4">
        {showStatus && (
          <>
            <Text>
              Sipariş durumu:{" "}
              <span className="text-ui-fg-subtle " data-testid="order-status">
                {formatStatus(order.fulfillment_status)}
              </span>
            </Text>
            <Text>
              Ödeme durumu:{" "}
              <span
                className="text-ui-fg-subtle "
                sata-testid="order-payment-status"
              >
                {formatStatus(order.payment_status)}
              </span>
            </Text>
          </>
        )}
      </div>
    </div>
  )
}

export default OrderDetails
