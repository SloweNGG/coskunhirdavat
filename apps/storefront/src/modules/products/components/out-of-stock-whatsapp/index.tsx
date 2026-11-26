import { XCircleSolid } from "@medusajs/icons"
import { whatsappLink } from "@lib/store-config"
import WhatsApp from "@modules/common/icons/whatsapp"

/** "Stokta yok" label on an out-of-stock card's photo, styled like the product page's. */
export const OutOfStockBadge = () => (
  <span
    className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-sale shadow-sm ring-1 ring-sale/20"
    data-testid="out-of-stock-badge"
  >
    <XCircleSolid className="h-3.5 w-3.5" />
    Stokta yok
  </span>
)

/** Space the card's "Ürünü İncele" button leaves free for this button. */
export const OUT_OF_STOCK_BUTTON_GAP = "mr-12"

/**
 * The card button's text. With the WhatsApp button beside it, phone-width
 * cards are too narrow for "Ürünü İncele", so it shortens to "İncele" there.
 */
export const CardButtonLabel = ({ outOfStock }: { outOfStock: boolean }) =>
  outOfStock ? (
    <>
      <span className="xsmall:hidden">İncele</span>
      <span className="hidden xsmall:inline">Ürünü İncele</span>
    </>
  ) : (
    <>Ürünü İncele</>
  )

/**
 * Round WhatsApp button for an out-of-stock product card, laid over the
 * right end of the card's button row. It sits next to (not inside) the card
 * link, so the card needs a `relative` wrapper around both.
 */
const OutOfStockWhatsApp = ({ title }: { title: string }) => (
  <a
    href={whatsappLink(
      `Merhaba, "${title}" ürünü stokta görünmüyor. Temin edebilir misiniz?`
    )}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={`Stokta yok. "${title}" için WhatsApp'tan sorun`}
    title="Stokta yok, WhatsApp'tan sorun"
    data-testid="out-of-stock-whatsapp"
    className="absolute bottom-[17px] right-[17px] z-10 flex h-10 w-10 items-center justify-center rounded-full bg-whatsapp text-navy transition-colors hover:bg-whatsapp-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-whatsapp-ink focus-visible:ring-offset-2"
  >
    <WhatsApp size="20" />
  </a>
)

export default OutOfStockWhatsApp
