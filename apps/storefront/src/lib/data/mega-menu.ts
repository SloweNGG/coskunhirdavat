import "server-only"

import { sdk } from "@lib/config"
import { priceAttribute } from "@lib/search-client"
import { FEATURED_PRODUCT_TAG } from "@lib/store-config"
import { getCacheOptions } from "./cookies"

export type MenuProduct = {
  id: string
  title: string
  handle: string
  thumbnail: string | null
  minPrice: number | null
  maxPrice: number | null
}

export type MegaMenuData = {
  /** Product count per category name. */
  counts: Record<string, number>
  /** A product thumbnail per category name, for categories without an image. */
  images: Record<string, string>
  /** Up to FEATURED_COUNT products per top-level category name. */
  featured: Record<string, MenuProduct[]>
}

const FEATURED_COUNT = 3
// How often the counts and featured products refresh, in seconds.
const REVALIDATE_SECONDS = 600
// `/store/search` rejects a batch of more than 20 queries.
const MAX_QUERIES_PER_REQUEST = 20

const EMPTY: MegaMenuData = { counts: {}, images: {}, featured: {} }

type SearchHit = { id: string; document?: Record<string, unknown> }
type SearchResult = {
  hits?: SearchHit[]
  facets?: Record<string, { values?: { value: string; count: number }[] }>
}

const asString = (value: unknown) => (typeof value === "string" ? value : null)
const asNumber = (value: unknown) => (typeof value === "number" ? value : null)

/**
 * Everything the desktop mega menu shows beyond the category tree, read from
 * the product search index in one batched request: product counts per
 * category, a thumbnail per subcategory, and featured products per top-level
 * category. Featured products are the ones tagged FEATURED_PRODUCT_TAG,
 * topped up with the category's highest-priced products.
 *
 * The index stores categories by name, so everything here is keyed by name.
 * A failure only costs the extras, never the menu itself.
 */
export const getMegaMenuData = async ({
  topCategories,
  subCategories,
  currencyCode,
}: {
  topCategories: string[]
  subCategories: string[]
  currencyCode: string
}): Promise<MegaMenuData> => {
  if (!topCategories.length) {
    return EMPTY
  }

  const minPrice = priceAttribute("min_price", currencyCode)
  const maxPrice = priceAttribute("max_price", currencyCode)
  const productFields = ["id", "title", "handle", "thumbnail", minPrice, maxPrice]
  const inCategory = (name: string) => ({ category: { $eq: name } })

  const queries = [
    {
      entity: "product",
      pagination: { take: 0 },
      search_options: {
        facets: [{ field: "category", type: "value", limit: 500 }],
      },
    },
    ...topCategories.flatMap((name) => [
      {
        entity: "product",
        pagination: { take: FEATURED_COUNT },
        filters: {
          $and: [inCategory(name), { labels: { $eq: FEATURED_PRODUCT_TAG } }],
        },
        fields: productFields,
      },
      {
        entity: "product",
        pagination: { take: FEATURED_COUNT, order: { [maxPrice]: "desc" } },
        filters: inCategory(name),
        fields: productFields,
      },
    ]),
    ...subCategories.map((name) => ({
      entity: "product",
      pagination: { take: 1 },
      filters: inCategory(name),
      fields: ["thumbnail"],
    })),
  ]

  const next = {
    ...(await getCacheOptions("products")),
    revalidate: REVALIDATE_SECONDS,
  }
  const batches: (typeof queries)[] = []
  for (let i = 0; i < queries.length; i += MAX_QUERIES_PER_REQUEST) {
    batches.push(queries.slice(i, i + MAX_QUERIES_PER_REQUEST))
  }

  let results: SearchResult[]

  try {
    const responses = await Promise.all(
      batches.map((batch) =>
        sdk.client.fetch<{ results: SearchResult[] }>("/store/search", {
          method: "POST",
          body: { queries: batch },
          next,
          cache: "force-cache",
        })
      )
    )
    results = responses.flatMap((response) => response.results ?? [])
  } catch {
    return EMPTY
  }

  if (!Array.isArray(results) || results.length !== queries.length) {
    return EMPTY
  }

  const toProduct = (hit: SearchHit): MenuProduct | null => {
    const doc = hit.document ?? {}
    const title = asString(doc.title)
    const handle = asString(doc.handle)

    if (!title || !handle) {
      return null
    }

    return {
      id: hit.id,
      title,
      handle,
      thumbnail: asString(doc.thumbnail),
      minPrice: asNumber(doc[minPrice]),
      maxPrice: asNumber(doc[maxPrice]),
    }
  }

  const counts: Record<string, number> = {}
  for (const { value, count } of results[0].facets?.category?.values ?? []) {
    counts[value] = count
  }

  const featured: Record<string, MenuProduct[]> = {}
  topCategories.forEach((name, index) => {
    const tagged = results[1 + index * 2].hits ?? []
    const byPrice = results[2 + index * 2].hits ?? []
    const seen = new Set<string>()

    featured[name] = [...tagged, ...byPrice]
      .filter((hit) => !seen.has(hit.id) && seen.add(hit.id))
      .map(toProduct)
      .filter((product): product is MenuProduct => product !== null)
      .slice(0, FEATURED_COUNT)
  })

  const images: Record<string, string> = {}
  const imageOffset = 1 + topCategories.length * 2
  subCategories.forEach((name, index) => {
    const thumbnail = asString(
      results[imageOffset + index].hits?.[0]?.document?.thumbnail
    )
    if (thumbnail) {
      images[name] = thumbnail
    }
  })

  return { counts, images, featured }
}
