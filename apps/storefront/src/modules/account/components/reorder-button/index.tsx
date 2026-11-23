"use client"

import { reorder } from "@lib/data/orders"
import { Button } from "@modules/common/components/ui"
import { useParams } from "next/navigation"
import { useActionState } from "react"

const ReorderButton = ({ orderId }: { orderId: string }) => {
  const { countryCode } = useParams() as { countryCode: string }
  const [error, formAction, pending] = useActionState(reorder, null)

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="order_id" value={orderId} />
      <input type="hidden" name="country_code" value={countryCode} />
      <Button type="submit" variant="secondary" isLoading={pending} data-testid="reorder-button">
        Tekrar sipariş ver
      </Button>
      {error && (
        <p className="text-sm text-sale" role="alert">
          {error}
        </p>
      )}
    </form>
  )
}

export default ReorderButton
