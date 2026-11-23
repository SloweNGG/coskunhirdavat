"use client"

import { Heart } from "@medusajs/icons"
import { FAVORITES_KEY, useStoredIds } from "@lib/hooks/use-stored-ids"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import StoredProducts from "@modules/products/components/stored-products"

const FavoritesList = () => {
  const { ids } = useStoredIds(FAVORITES_KEY)

  return (
    <StoredProducts
      ids={ids}
      limit={50}
      eyebrow={`${ids.length} ürün`}
      title="Favorilerim"
      empty={
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-line px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-soft text-navy">
            <Heart />
          </span>
          <h1 className="text-xl font-semibold text-navy">
            Favori listeniz boş
          </h1>
          <p className="max-w-sm text-sm text-muted">
            Beğendiğiniz ürünlerde kalp simgesine dokunun, burada listelensin.
          </p>
          <LocalizedClientLink
            href="/store"
            className="rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-brand-fg hover:bg-brand-dark"
          >
            Ürünlere göz atın
          </LocalizedClientLink>
        </div>
      }
    />
  )
}

export default FavoritesList
