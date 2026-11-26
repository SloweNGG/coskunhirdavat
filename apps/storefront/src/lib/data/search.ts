import "server-only"

import { sdk } from "@lib/config"
import { priceAttribute, type PriceField } from "@lib/search-client"
import {
  buildVocabulary,
  correctQuery,
  type VocabularyEntry,
} from "@lib/search/text"

// `/store/search` returns at most 100 hits per query and takes at most 20
// queries per request.
const MAX_TAKE = 100
const MAX_QUERIES_PER_REQUEST = 20
// The typo vocabulary reads every product title; cap it for huge catalogs.
// Only titles: category names are not searchable in the index, so correcting
// a word to one would find nothing.
const MAX_VOCABULARY_PRODUCTS = 5000
const VOCABULARY_TTL_MS = 10 * 60 * 1000
const MAX_CATEGORY_FACETS = 20
// Popular terms and featured products are the same for every shopper.
const DISCOVERY_REVALIDATE_SECONDS = 600
const MAX_POPULAR_PRODUCTS = 6
const MAX_VIEWED = 6

const PRICE_FIELDS: PriceField[] = [
  "min_price",
  "max_price",
  "original_price",
  "on_sale",
]

/** What a suggestion row needs: picture, title, link, categories, price. */
export const suggestionFields = (currencyCode: string) => [
  "id",
  "title",
  "handle",
  "thumbnail",
  "category",
  ...PRICE_FIELDS.map((field) => priceAttribute(field, currencyCode)),
]

type SearchHit = { id: string; document?: Record<string, unknown> }
type SearchResult = {
  hits?: SearchHit[]
  facets?: Record<string, { values?: { value: string; count: number }[] }>
  metadata?: { count?: number }
}

export type CatalogHit = { id: string } & Record<string, unknown>

export type CatalogSearch = {
  /** What was searched: the correction when one was used, else the input. */
  query: string
  /** The query as typed, when it found nothing and a correction was used. */
  correctedFrom: string | null
  total: number
  hits: CatalogHit[]
  /** Product counts per category name, for this query. */
  categories: { name: string; count: number }[]
}

const runQueries = async (queries: object[]) => {
  const { results } = await sdk.client.fetch<{ results: SearchResult[] }>(
    "/store/search",
    { method: "POST", body: { queries }, cache: "no-store" }
  )
  return results
}

const chunk = <T>(items: T[], size: number) => {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

const loadVocabulary = async (): Promise<VocabularyEntry[]> => {
  const page = (skip: number) => ({
    entity: "product",
    pagination: { take: MAX_TAKE, skip, order: { created_at: "asc" } },
    fields: ["title"],
  })

  const [first] = await runQueries([page(0)])
  const total = Math.min(first?.metadata?.count ?? 0, MAX_VOCABULARY_PRODUCTS)
  const rest: object[] = []
  for (let skip = MAX_TAKE; skip < total; skip += MAX_TAKE) {
    rest.push(page(skip))
  }
  const more = await Promise.all(
    chunk(rest, MAX_QUERIES_PER_REQUEST).map(runQueries)
  )

  const titles = [first, ...more.flat()]
    .flatMap((result) => result?.hits ?? [])
    .map((hit) => hit.document?.title)
    .filter((title): title is string => typeof title === "string")

  return buildVocabulary(titles)
}

let vocabulary: {
  loadedAt: number
  entries: Promise<VocabularyEntry[]>
} | null = null

/** Catalog words for typo correction, rebuilt every 10 minutes. */
const getVocabulary = () => {
  if (!vocabulary || Date.now() - vocabulary.loadedAt > VOCABULARY_TTL_MS) {
    vocabulary = {
      loadedAt: Date.now(),
      entries: loadVocabulary().catch(() => {
        // Retry on the next search rather than caching the failure.
        vocabulary = null
        return []
      }),
    }
  }
  return vocabulary.entries
}

/**
 * Searches the product index the way the header search box and the search
 * page both need it. When the query finds nothing, its unknown words are
 * corrected against the catalog's own words and the search runs again
 * ("lazr" -> "lazer"); the result says so in `correctedFrom`.
 */
export const searchCatalog = async (
  query: string,
  {
    take,
    skip = 0,
    fields,
    withCategories = false,
  }: {
    take: number
    skip?: number
    fields: string[]
    withCategories?: boolean
  }
): Promise<CatalogSearch> => {
  const build = (q: string) => ({
    entity: "product",
    filters: { q },
    pagination: { take: Math.min(take, MAX_TAKE), skip },
    fields,
    search_options: {
      match_strategy: "last",
      ...(withCategories && {
        facets: [
          { field: "category", type: "value", limit: MAX_CATEGORY_FACETS },
        ],
      }),
    },
  })

  const toSearch = (
    result: SearchResult | undefined,
    searched: string,
    correctedFrom: string | null
  ): CatalogSearch => ({
    query: searched,
    correctedFrom,
    total: result?.metadata?.count ?? 0,
    hits: (result?.hits ?? []).map((hit) => ({ ...hit.document, id: hit.id })),
    categories: (result?.facets?.category?.values ?? [])
      .filter((facet) => facet.count > 0)
      .map((facet) => ({ name: facet.value, count: facet.count })),
  })

  const [result] = await runQueries([build(query)])
  if ((result?.metadata?.count ?? 0) > 0) {
    return toSearch(result, query, null)
  }

  const corrected = correctQuery(query, await getVocabulary())
  if (!corrected) {
    return toSearch(result, query, null)
  }

  const [retry] = await runQueries([build(corrected)])
  return (retry?.metadata?.count ?? 0) > 0
    ? toSearch(retry, corrected, query)
    : toSearch(result, query, null)
}

export type SearchDiscovery = {
  /** Each popular search term with the picture of its best match. */
  popularTerms: { term: string; thumbnail: string | null }[]
  /** Products tagged as featured, then the best match of each popular term. */
  popularProducts: CatalogHit[]
  /** The shopper's recently viewed products, most recent first. */
  viewed: CatalogHit[]
}

const toHits = (result: SearchResult | undefined): CatalogHit[] =>
  (result?.hits ?? []).map((hit) => ({ ...hit.document, id: hit.id }))

/**
 * What the empty header search box shows: pictures for the popular search
 * terms, popular products, and the shopper's recently viewed products. The
 * shared part is one cached request; recently viewed is per shopper.
 */
export const getSearchDiscovery = async ({
  terms,
  featuredTag,
  viewedIds,
  currencyCode,
}: {
  terms: string[]
  featuredTag: string
  viewedIds: string[]
  currencyCode: string
}): Promise<SearchDiscovery> => {
  const fields = suggestionFields(currencyCode)
  const popular = terms.slice(0, MAX_QUERIES_PER_REQUEST - 1)
  const viewed = viewedIds.slice(0, MAX_VIEWED)

  const shared = [
    {
      entity: "product",
      filters: { labels: { $eq: featuredTag } },
      pagination: { take: MAX_POPULAR_PRODUCTS },
      fields,
    },
    ...popular.map((term) => ({
      entity: "product",
      filters: { q: term },
      pagination: { take: 1 },
      fields,
      search_options: { match_strategy: "last" },
    })),
  ]

  const [sharedResults, viewedResults] = await Promise.all([
    sdk.client
      .fetch<{ results: SearchResult[] }>("/store/search", {
        method: "POST",
        body: { queries: shared },
        next: { revalidate: DISCOVERY_REVALIDATE_SECONDS },
      })
      .then(({ results }) => results),
    viewed.length
      ? runQueries([
          {
            entity: "product",
            filters: { id: { $in: viewed } },
            pagination: { take: viewed.length },
            fields,
          },
        ])
      : Promise.resolve([] as SearchResult[]),
  ])

  const [featuredResult, ...termResults] = sharedResults
  const termHits = termResults.map((result) => toHits(result)[0] ?? null)

  const seen = new Set<string>()
  const popularProducts = [
    ...toHits(featuredResult),
    ...termHits.filter((hit): hit is CatalogHit => hit !== null),
  ]
    .filter((hit) => !seen.has(hit.id) && Boolean(seen.add(hit.id)))
    .slice(0, MAX_POPULAR_PRODUCTS)

  const viewedById = new Map(
    toHits(viewedResults[0]).map((hit) => [hit.id, hit])
  )

  return {
    popularTerms: popular.map((term, i) => {
      const thumbnail = termHits[i]?.thumbnail
      return {
        term,
        thumbnail: typeof thumbnail === "string" ? thumbnail : null,
      }
    }),
    popularProducts,
    viewed: viewed.flatMap((id) => viewedById.get(id) ?? []),
  }
}
