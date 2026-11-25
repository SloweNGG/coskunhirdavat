"use client"

import { RECENT_KEY, useStoredIds } from "@lib/hooks/use-stored-ids"
import StoredProducts from "@modules/products/components/stored-products"
import { useEffect } from "react"

/**
 * "Son baktığınız ürünler". Pass `currentId` on a product page to record the
 * visit and leave that product out of the list.
 */
const RecentlyViewed = ({
  currentId,
  className,
}: {
  currentId?: string
  className?: string
}) => {
  const { ids, push } = useStoredIds(RECENT_KEY, 20)

  useEffect(() => {
    if (currentId) push(currentId)
  }, [currentId, push])

  return (
    <StoredProducts
      ids={ids}
      excludeId={currentId}
      limit={4}
      eyebrow="Geçmiş"
      title="Son baktığınız ürünler"
      className={className}
    />
  )
}

export default RecentlyViewed
