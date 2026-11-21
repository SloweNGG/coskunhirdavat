"use client"

import { ArrowRight, ChatBubbleLeftRight, CheckCircleSolid } from "@medusajs/icons"
import { ProjectItem } from "@lib/projects"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { clx } from "@modules/common/components/ui"
import { useState } from "react"

type ShoppingListProps = {
  projectTitle: string
  items: ProjectItem[]
  whatsappNumber: string
}

/** Checklist of materials; "Bende var" marks owned items, the rest can be asked on WhatsApp. */
const ShoppingList = ({ projectTitle, items, whatsappNumber }: ShoppingListProps) => {
  const [owned, setOwned] = useState<Set<number>>(new Set())

  const toggle = (index: number) =>
    setOwned((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })

  const missing = items.filter((_, index) => !owned.has(index))
  const message = [
    `Merhaba, "${projectTitle}" işi için şu malzemeler gerekiyor:`,
    ...missing.map((item) => `- ${item.name}`),
    "Fiyat ve stok bilgisi alabilir miyim?",
  ].join("\n")
  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-white">
      <div className="flex items-center justify-between gap-4 border-b border-line bg-soft px-5 py-4">
        <h2 className="text-lg font-bold text-navy">Alışveriş Listesi</h2>
        <span className="font-mono text-xs font-semibold uppercase text-navy/60">
          {missing.length}/{items.length} eksik
        </span>
      </div>

      <ul className="divide-y divide-line">
        {items.map((item, index) => {
          const isOwned = owned.has(index)

          return (
            <li
              key={item.name}
              className={clx(
                "flex flex-col gap-3 px-5 py-4 transition-colors xsmall:flex-row xsmall:items-center",
                isOwned && "bg-soft"
              )}
            >
              <div className="flex flex-1 items-start gap-4">
                <span className="mt-0.5 font-mono text-sm font-bold text-brand-ink">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="flex flex-col">
                  <span
                    className={clx(
                      "font-semibold text-navy",
                      isOwned && "text-muted line-through"
                    )}
                  >
                    {item.name}
                  </span>
                  {item.note && (
                    <span className="text-sm text-muted">{item.note}</span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 pl-9 xsmall:pl-0">
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  aria-pressed={isOwned}
                  className={clx(
                    "flex h-9 items-center gap-x-1.5 rounded-md border px-3 text-sm font-medium transition-colors",
                    isOwned
                      ? "border-navy bg-navy text-white"
                      : "border-line text-navy hover:border-navy"
                  )}
                >
                  {isOwned && <CheckCircleSolid />}
                  Bende var
                </button>
                {!isOwned && (
                  <LocalizedClientLink
                    href={`/search?q=${encodeURIComponent(item.query)}`}
                    className="flex h-9 items-center gap-x-1 rounded-md bg-brand px-3 text-sm font-semibold text-brand-fg hover:bg-brand-dark"
                  >
                    Ürünleri gör <ArrowRight />
                  </LocalizedClientLink>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      <div className="flex flex-col gap-3 border-t border-line bg-soft px-5 py-4 xsmall:flex-row xsmall:items-center xsmall:justify-between">
        <p className="text-sm text-muted">
          Listeyi tek tek aramak istemiyor musunuz? Eksiklerinizi bize gönderin, fiyat
          verelim.
        </p>
        <a
          href={missing.length ? whatsappHref : undefined}
          target="_blank"
          rel="noreferrer"
          aria-disabled={!missing.length}
          className={clx(
            "flex shrink-0 items-center justify-center gap-x-2 rounded-lg bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-navy-light",
            !missing.length && "pointer-events-none opacity-40"
          )}
        >
          <ChatBubbleLeftRight />
          Eksiklerimi WhatsApp&apos;tan sor
        </a>
      </div>
    </div>
  )
}

export default ShoppingList
