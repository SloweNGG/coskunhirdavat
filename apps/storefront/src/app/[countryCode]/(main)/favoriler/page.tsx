import { Metadata } from "next"

import { STORE_NAME } from "@lib/util/site"
import FavoritesList from "@modules/products/components/favorites-list"

export const metadata: Metadata = {
  title: `Favorilerim | ${STORE_NAME}`,
  robots: { index: false },
}

export default function FavoritesPage() {
  return (
    <div className="content-container py-10 small:py-14">
      <FavoritesList />
    </div>
  )
}
