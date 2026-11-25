import { retrieveOrder } from "@lib/data/orders"
import OrderDetailsTemplate from "@modules/order/templates/order-details-template"
import { Metadata } from "next"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const order = await retrieveOrder(params.id).catch(() => null)

  if (!order) {
    notFound()
  }

  return {
    title: `Sipariş #${order.display_id}`,
    description: `Siparişinizi görüntüleyin`,
  }
}

export default async function OrderDetailPage(props: Props) {
  const params = await props.params
  const order = await retrieveOrder(params.id).catch(() => null)

  if (!order) {
    notFound()
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        {/* Plain <a>: route handler streams the PDF from the backend */}
        <a
          href={`/api/invoice/${order.id}`}
          className="rounded-md border border-line px-4 py-2 text-small-semi hover:bg-soft"
          data-testid="download-invoice-link"
        >
          Faturayı indir
        </a>
      </div>
      <OrderDetailsTemplate order={order} />
    </>
  )
}
