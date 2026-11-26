import { NextRequest } from "next/server"

import { getSearchDiscovery } from "@lib/data/search"
import { FEATURED_PRODUCT_TAG, POPULAR_SEARCHES } from "@lib/store-config"

const MAX_VIEWED = 6
const PRODUCT_ID = /^prod_[A-Za-z0-9]+$/

/**
 * What the header search box shows before anything is typed: popular search
 * terms with a picture, popular products, and the shopper's recently viewed
 * products (`viewed`: product ids from their browser, most recent first).
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const currency = params.get("currency") ?? "try"
  const viewedIds = (params.get("viewed") ?? "")
    .split(",")
    .filter((id) => PRODUCT_ID.test(id))
    .slice(0, MAX_VIEWED)

  try {
    const discovery = await getSearchDiscovery({
      terms: POPULAR_SEARCHES,
      featuredTag: FEATURED_PRODUCT_TAG,
      viewedIds,
      currencyCode: currency,
    })
    return Response.json(discovery, {
      headers: { "Cache-Control": "private, max-age=60" },
    })
  } catch {
    return Response.json({ message: "Öneriler yüklenemedi" }, { status: 502 })
  }
}
