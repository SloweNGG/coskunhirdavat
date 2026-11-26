import { WHATSAPP_BUTTON_MESSAGE, whatsappLink } from "@lib/store-config"
import WhatsApp from "@modules/common/icons/whatsapp"

/**
 * Floating WhatsApp button in the bottom-right corner of every store page
 * (checkout has its own help link). Phones lift it above the bottom tab bar;
 * while the product page's sticky add-to-cart bar is up it fades out
 * (`.whatsapp-fab` + `data-sticky-bar` in globals.css). Desktop shows a
 * label on hover.
 */
const WhatsAppButton = () => (
  <a
    href={whatsappLink(WHATSAPP_BUTTON_MESSAGE)}
    target="_blank"
    rel="noopener noreferrer"
    aria-label="WhatsApp'tan bize yazın"
    className="whatsapp-fab group fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-40 rounded-full outline-none transition-[opacity,transform] duration-300 focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 small:bottom-6 small:right-6"
  >
    {/* absolute, so the hidden label never catches clicks on the page */}
    <span
      aria-hidden
      className="pointer-events-none absolute right-full top-1/2 mr-3 hidden -translate-y-1/2 translate-x-2 whitespace-nowrap rounded-full bg-white px-3.5 py-2 text-sm font-semibold text-navy opacity-0 shadow-[0_4px_14px_rgba(0,0,0,0.12)] transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 small:block"
    >
      WhatsApp&apos;tan yazın
    </span>
    {/* white glyph on the round button (owner's choice); text buttons keep navy text */}
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-whatsapp text-white shadow-[0_6px_16px_rgba(37,211,102,0.35),0_2px_6px_rgba(0,0,0,0.15)] transition-[background-color,transform] duration-200 group-hover:scale-105 group-hover:bg-whatsapp-dark small:h-14 small:w-14">
      <WhatsApp size="26" />
    </span>
  </a>
)

export default WhatsAppButton
