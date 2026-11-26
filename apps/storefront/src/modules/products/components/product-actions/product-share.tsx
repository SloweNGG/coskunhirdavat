"use client"

import { ChatBubbleLeftRight, Heart, Share } from "@medusajs/icons"
import { FAVORITES_KEY, useStoredIds } from "@lib/hooks/use-stored-ids"
import { whatsappLink } from "@lib/store-config"
import { clx } from "@modules/common/components/ui"
import { useState } from "react"

/** WhatsApp question and bulk-order quote buttons under add to cart. */
const ProductShare = ({
  title,
  quoteText,
}: {
  title: string
  /** pre-filled WhatsApp text for a bulk-order quote */
  quoteText: string
}) => (
  <div className="grid grid-cols-2 gap-3">
    <a
      href={whatsappLink(`Merhaba, "${title}" ürünü hakkında bilgi almak istiyorum.`)}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-12 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-whatsapp px-2 text-[13px] font-semibold text-navy transition-colors hover:bg-whatsapp-dark xsmall:gap-2 xsmall:text-sm"
    >
      <ChatBubbleLeftRight />
      WhatsApp&apos;tan sor
    </a>
    <a
      href={whatsappLink(quoteText)}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-12 items-center justify-center whitespace-nowrap rounded-full border-2 border-navy px-2 text-[13px] font-semibold text-navy transition-colors hover:bg-navy hover:text-white xsmall:text-sm"
    >
      Toplu alım teklifi
    </a>
  </div>
)

const iconButton =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors"

/** Icon-only Save (favourite) and Share buttons, shown next to the title. */
export const ProductQuickActions = ({
  productId,
  title,
}: {
  productId: string
  title: string
}) => {
  const [copied, setCopied] = useState(false)
  const { ids, toggle } = useStoredIds(FAVORITES_KEY)
  const saved = ids.includes(productId)

  const share = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => {})
      return
    }
    await navigator.clipboard?.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => toggle(productId)}
        aria-pressed={saved}
        aria-label={saved ? "Favorilerden çıkar" : "Favorilere kaydet"}
        title={saved ? "Favorilerden çıkar" : "Favorilere kaydet"}
        className={clx(
          iconButton,
          saved
            ? "border-sale/30 bg-sale/5 text-sale"
            : "border-line text-navy hover:border-navy/40"
        )}
      >
        {saved ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.1 5.2 3 1.6-1.9 3.1-3 5.2-3 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z" />
          </svg>
        ) : (
          <Heart />
        )}
      </button>
      <button
        type="button"
        onClick={share}
        aria-label={copied ? "Bağlantı kopyalandı" : "Paylaş"}
        title={copied ? "Bağlantı kopyalandı" : "Paylaş"}
        className={clx(
          iconButton,
          copied
            ? "border-emerald-600/40 text-emerald-700"
            : "border-line text-navy hover:border-navy/40"
        )}
      >
        <Share />
      </button>
    </div>
  )
}

export default ProductShare
