"use client"

import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import SectionHeading from "@modules/home/components/section-heading"
import ProductPreview from "@modules/products/components/product-preview"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

type StoredProductsProps = {
  ids: string[]
  /** Product to leave out, e.g. the one on the current page. */
  excludeId?: string
  limit?: number
  title: string
  eyebrow?: string
  /** Shown when there is nothing to list; the section is hidden when omitted. */
  empty?: React.ReactNode
  className?: string
}

/** Fetches current prices for stored product ids and renders product cards. */
const StoredProducts = ({
  ids,
  excludeId,
  limit = 8,
  title,
  eyebrow,
  empty,
  className,
}: StoredProductsProps) => {
  const countryCode = useParams().countryCode as string
  const wanted = ids.filter((id) => id !== excludeId).slice(0, limit)
  const key = wanted.join(",")
  const [result, setResult] = useState<{
    key: string
    products: HttpTypes.StoreProduct[]
  } | null>(null)

  useEffect(() => {
    if (!key) return
    let cancelled = false
    listProducts({
      countryCode,
      queryParams: {
        id: key.split(","),
        limit,
        fields: "*variants.calculated_price,+variants.sku,*categories",
      },
    })
      .then(({ response }) => {
        if (cancelled) return
        // keep the stored order (most recent first)
        const order = key.split(",")
        const products = [...response.products].sort(
          (a, b) => order.indexOf(a.id) - order.indexOf(b.id)
        )
        setResult({ key, products })
      })
      .catch(() => !cancelled && setResult({ key, products: [] }))
    return () => {
      cancelled = true
    }
  }, [key, countryCode, limit])

  const products = key && result?.key === key ? result.products : []
  const loading = !!key && result?.key !== key

  if (!loading && !products.length) {
    return empty ? <div className={className}>{empty}</div> : null
  }

  return (
    <section className={className}>
      <SectionHeading eyebrow={eyebrow} title={title} />
      <ul className="grid grid-cols-2 gap-3 small:grid-cols-4 small:gap-5">
        {loading
          ? wanted.slice(0, 4).map((id) => (
              <li
                key={id}
                className="aspect-[3/4] animate-pulse rounded-lg bg-soft"
              />
            ))
          : products.map((p) => (
              <li key={p.id}>
                <ProductPreview product={p} />
              </li>
            ))}
      </ul>
    </section>
  )
}

export default StoredProducts
