"use client"

import { useEffect, useState } from "react"

import { getOutOfStockHandles } from "@lib/data/products"

const NONE: ReadonlySet<string> = new Set()

/**
 * Out-of-stock handles among the products on screen. Search-index hits carry
 * no stock data, so this asks the store API once per set of hits. Until the
 * answer arrives (or if it fails) nothing counts as out of stock.
 */
export function useOutOfStockHandles(handles: (string | null)[]) {
  const key = handles.filter(Boolean).join("|")
  const [result, setResult] = useState<{ key: string; handles: Set<string> }>()

  useEffect(() => {
    if (!key) return
    let cancelled = false
    getOutOfStockHandles(key.split("|"))
      .then((list) => {
        if (!cancelled) setResult({ key, handles: new Set(list) })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [key])

  return result?.key === key ? result.handles : NONE
}
