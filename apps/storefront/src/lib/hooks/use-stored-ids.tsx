"use client"

import { useCallback, useSyncExternalStore } from "react"

// shortcut: kept in this browser's localStorage, so lists don't follow the
// shopper to another device; move to a customer-linked backend list if needed.
export const FAVORITES_KEY = "coskun:favorites"
export const RECENT_KEY = "coskun:recently-viewed"
export const RECENT_SEARCHES_KEY = "coskun:recent-searches"

const EVENT = "coskun:stored-ids"
const EMPTY: string[] = []
const cache = new Map<string, { raw: string | null; ids: string[] }>()

const read = (key: string): string[] => {
  let raw: string | null = null
  try {
    raw = window.localStorage.getItem(key)
  } catch {
    return EMPTY
  }
  const hit = cache.get(key)
  if (hit && hit.raw === raw) return hit.ids
  let ids: string[] = EMPTY
  try {
    const parsed = raw ? JSON.parse(raw) : []
    ids = Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : EMPTY
  } catch {
    ids = EMPTY
  }
  cache.set(key, { raw, ids })
  return ids
}

const write = (key: string, ids: string[]) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(ids))
  } catch {
    // storage blocked (private mode): the list just won't persist
  }
  window.dispatchEvent(new Event(EVENT))
}

const subscribe = (onChange: () => void) => {
  window.addEventListener(EVENT, onChange)
  window.addEventListener("storage", onChange)
  return () => {
    window.removeEventListener(EVENT, onChange)
    window.removeEventListener("storage", onChange)
  }
}

/**
 * String list in localStorage (product ids, recent search terms), shared live
 * between components and tabs.
 */
export const useStoredIds = (key: string, limit = 50) => {
  const ids = useSyncExternalStore(subscribe, () => read(key), () => EMPTY)

  const toggle = useCallback(
    (id: string) => {
      const current = read(key)
      write(
        key,
        current.includes(id) ? current.filter((x) => x !== id) : [id, ...current].slice(0, limit)
      )
    },
    [key, limit]
  )

  /** Moves the id to the front (most recent first). */
  const push = useCallback(
    (id: string) => {
      const current = read(key)
      if (current[0] === id) return
      write(key, [id, ...current.filter((x) => x !== id)].slice(0, limit))
    },
    [key, limit]
  )

  const clear = useCallback(() => write(key, []), [key])

  return { ids, toggle, push, clear }
}
