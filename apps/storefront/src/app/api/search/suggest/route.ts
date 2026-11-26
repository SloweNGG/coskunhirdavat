import { NextRequest } from "next/server"

import {
  searchCatalog,
  suggestionFields,
  type CatalogSearch,
} from "@lib/data/search"

const MAX_PRODUCTS = 6
const MIN_QUERY_LENGTH = 2
const MAX_QUERY_LENGTH = 100

/**
 * Suggestions for the header search box: the first few products, the
 * categories the matches fall in, and a typo correction when the query as
 * typed finds nothing. Runs on the server so the search page and the box share
 * one search (and one typo vocabulary).
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const query = (params.get("q") ?? "").trim().slice(0, MAX_QUERY_LENGTH)
  const currency = params.get("currency") ?? "try"

  if (query.length < MIN_QUERY_LENGTH) {
    const empty: CatalogSearch = {
      query,
      correctedFrom: null,
      total: 0,
      hits: [],
      categories: [],
    }
    return Response.json(empty)
  }

  try {
    const result: CatalogSearch = await searchCatalog(query, {
      take: MAX_PRODUCTS,
      fields: suggestionFields(currency),
      withCategories: true,
    })

    return Response.json(result, {
      // Short browser cache: backspacing over a query reuses the answer.
      headers: { "Cache-Control": "public, max-age=60" },
    })
  } catch {
    return Response.json({ message: "Arama yapılamadı" }, { status: 502 })
  }
}
