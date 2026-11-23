"use client"

import { CheckMini, SquareTwoStack } from "@medusajs/icons"
import { useState } from "react"

/** Copies a value (e.g. an IBAN) to the clipboard. */
const CopyButton = ({ value, label }: { value: string; label: string }) => {
  const [copied, setCopied] = useState(false)

  return (
    <button
      type="button"
      onClick={async (e) => {
        e.stopPropagation()
        let ok = false
        try {
          await navigator.clipboard.writeText(value)
          ok = true
        } catch {
          // Clipboard API blocked (permissions / older browser): legacy fallback.
          const t = document.createElement("textarea")
          t.value = value
          t.setAttribute("readonly", "")
          t.style.position = "fixed"
          t.style.opacity = "0"
          document.body.appendChild(t)
          t.select()
          ok = document.execCommand("copy")
          t.remove()
        }
        if (ok) {
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        }
      }}
      aria-label={copied ? `${label} kopyalandı` : `${label} kopyala`}
      title={copied ? "Kopyalandı" : "Kopyala"}
      className={
        copied
          ? "flex h-8 w-8 shrink-0 items-center justify-center text-emerald-600"
          : "flex h-8 w-8 shrink-0 items-center justify-center text-navy/60 hover:text-navy"
      }
    >
      {copied ? <CheckMini /> : <SquareTwoStack />}
    </button>
  )
}

export default CopyButton
