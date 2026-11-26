"use client"

import { useEffect, useState } from "react"

import type { CatalogSearch, SearchDiscovery } from "@lib/data/search"

export type SuggestResponse = CatalogSearch
export type { SearchDiscovery }

const DEBOUNCE_MS = 180
const CACHE_LIMIT = 40

// Answers by query, shared by every search box on the page, so backspacing or
// reopening the box shows them at once.
const cache = new Map<string, SuggestResponse>()

const remember = (key: string, value: SuggestResponse) => {
  cache.delete(key)
  cache.set(key, value)
  if (cache.size > CACHE_LIMIT) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
}

export type Suggestions = {
  /** The newest answer available; may belong to an earlier query. */
  data: SuggestResponse | null
  /** Whether `data` answers the current query. */
  current: boolean
  error: boolean
}

/**
 * Header search suggestions for `term` (null: nothing to look up). Requests
 * are debounced and the previous one is cancelled, so a fast typist only
 * waits for the last query; until it answers, the previous answer is kept.
 */
export const useSuggestions = (
  term: string | null,
  currencyCode: string
): Suggestions => {
  const key = term ? `${currencyCode}|${term.toLocaleLowerCase("tr")}` : null
  const cached = key ? cache.get(key) : undefined

  const [latest, setLatest] = useState<{
    key: string
    data: SuggestResponse
  } | null>(null)
  const [failedKey, setFailedKey] = useState<string | null>(null)

  // Keep a cached answer as the latest, so the next query's wait shows it
  // rather than an older one.
  if (key && cached && latest?.key !== key) {
    setLatest({ key, data: cached })
  }

  useEffect(() => {
    if (!key || !term || cache.has(key)) return

    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ q: term, currency: currencyCode })
      fetch(`/api/search/suggest?${params}`, { signal: controller.signal })
        .then((response) =>
          response.ok
            ? (response.json() as Promise<SuggestResponse>)
            : Promise.reject(new Error(`HTTP ${response.status}`))
        )
        .then((data) => {
          remember(key, data)
          setLatest({ key, data })
        })
        .catch(() => {
          if (!controller.signal.aborted) setFailedKey(key)
        })
    }, DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [key, term, currencyCode])

  if (cached) {
    return { data: cached, current: true, error: false }
  }

  return {
    data: latest?.data ?? null,
    current: false,
    error: key !== null && failedKey === key,
  }
}

const discoveries = new Map<string, SearchDiscovery>()

/**
 * What the empty search box shows (popular terms with pictures, popular and
 * recently viewed products), fetched once `enabled` turns on and kept for
 * the page's lifetime per set of viewed products.
 */
export const useDiscovery = (
  viewedIds: string[],
  currencyCode: string,
  enabled: boolean
): { data: SearchDiscovery | null; failed: boolean } => {
  const key = `${currencyCode}|${viewedIds.join(",")}`
  // The last answer, shown while a new list of viewed products loads.
  const [latest, setLatest] = useState<SearchDiscovery | null>(null)
  const [failedKey, setFailedKey] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || discoveries.has(key)) return

    const controller = new AbortController()
    const [currency, viewed] = key.split("|")
    const params = new URLSearchParams({ currency, viewed })
    fetch(`/api/search/discover?${params}`, { signal: controller.signal })
      .then((response) =>
        response.ok
          ? (response.json() as Promise<SearchDiscovery>)
          : Promise.reject(new Error(`HTTP ${response.status}`))
      )
      .then((data) => {
        discoveries.set(key, data)
        setLatest(data)
      })
      .catch(() => {
        // The box still works without pictures; just stop waiting for them.
        if (!controller.signal.aborted) setFailedKey(key)
      })

    return () => controller.abort()
  }, [key, enabled])

  return {
    data: discoveries.get(key) ?? latest,
    failed: failedKey === key && !discoveries.has(key),
  }
}
