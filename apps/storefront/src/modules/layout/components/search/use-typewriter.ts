"use client"

import { useEffect, useState, useSyncExternalStore } from "react"

const TYPE_MS = 90
const DELETE_MS = 35
const HOLD_MS = 1800
const GAP_MS = 350

type Step = {
  index: number
  length: number
  phase: "typing" | "holding" | "deleting"
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)"

const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED_MOTION)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

/**
 * Shows `texts` one after another as if typed: types a text, holds it,
 * deletes it, types the next, forever. Starts by holding texts[0] in full, so
 * the first frame matches the server render.
 *
 * Returns the text to show (with a "|" caret while typing or deleting), or
 * null when `enabled` is false or the visitor prefers reduced motion; the
 * caller then shows its static text. Pass a stable (module-level) array.
 */
export function useTypewriter(texts: readonly string[], enabled: boolean) {
  const [step, setStep] = useState<Step>(() => ({
    index: 0,
    length: texts[0]?.length ?? 0,
    phase: "holding",
  }))
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false
  )
  const running = enabled && !reducedMotion && texts.length > 0

  useEffect(() => {
    if (!running) return
    const text = texts[step.index] ?? ""
    let delay: number
    let next: Step

    if (step.phase === "typing") {
      next =
        step.length < text.length
          ? { ...step, length: step.length + 1 }
          : { ...step, phase: "holding" }
      delay = TYPE_MS
    } else if (step.phase === "holding") {
      next = { ...step, phase: "deleting" }
      delay = HOLD_MS
    } else if (step.length > 0) {
      next = { ...step, length: step.length - 1 }
      delay = DELETE_MS
    } else {
      next = { index: (step.index + 1) % texts.length, length: 0, phase: "typing" }
      delay = GAP_MS
    }

    const timer = window.setTimeout(() => setStep(next), delay)
    return () => window.clearTimeout(timer)
  }, [running, step, texts])

  if (!running) return null
  const shown = (texts[step.index] ?? "").slice(0, step.length)
  return step.phase === "holding" ? shown : `${shown}|`
}
