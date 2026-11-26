import { ChatBubbleLeftRight, Phone } from "@medusajs/icons"
import { STORE_INFO } from "@lib/store-config"
import StoreIcon from "@modules/common/components/store-icon"

const HIGHLIGHTS = [
  { icon: "shield", text: "23 yıllık tecrübe" },
  { icon: "truck", text: "Hızlı kargo" },
  { icon: "card", text: "Kredi kartına taksit" },
  { icon: "chat", text: "Uzman destek" },
]

/**
 * Gradient help band (highlights, expert help, phone card); home page only,
 * right above the footer. `data-footer-overlap` lets the footer's rounded top
 * slide 40px over this band's extra bottom padding, so the corners show the
 * band's colour instead of a white notch.
 */
const HelpBand = () => (
  <div
    data-footer-overlap
    className="bg-gradient-to-r from-white via-brand-50 to-brand-100"
  >
    <div className="content-container">
      <ul className="flex flex-wrap gap-x-8 gap-y-4 border-b border-navy/10 py-8">
        {HIGHLIGHTS.map((h) => (
          <li
            key={h.text}
            className="flex items-center gap-x-2.5 text-sm font-medium text-navy"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-brand-fg shadow-[0_4px_12px_rgb(var(--brand)/0.35)]">
              <StoreIcon name={h.icon} className="h-4 w-4" />
            </span>
            {h.text}
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-8 pb-20 pt-10 small:flex-row small:items-center small:justify-between">
        <div className="max-w-xl">
          <span className="inline-flex items-center gap-x-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-navy shadow-sm">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand text-brand-fg">
              <ChatBubbleLeftRight className="h-3.5 w-3.5" />
            </span>
            Uzman Desteği
          </span>
          <h2 className="mt-4 text-2xl font-bold leading-tight text-navy small:text-3xl">
            Doğru ürünü bulmakta
            <br />
            zorlanıyor musunuz?
          </h2>
          <p className="mt-3 text-sm text-navy/70">
            Ölçü, model ya da uyumlu parça… Uzman ekibimiz size en uygun ürünü
            seçmenizde yardımcı olsun.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={STORE_INFO.whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-x-2 rounded-full bg-whatsapp px-5 py-3 text-sm font-semibold text-navy shadow-[0_6px_16px_rgba(37,211,102,0.3)] transition-colors hover:bg-whatsapp-dark"
            >
              <ChatBubbleLeftRight />
              WhatsApp destek hattı
            </a>
            <a
              href={STORE_INFO.phoneHref}
              className="flex items-center gap-x-2 rounded-full border border-navy/15 bg-white px-5 py-3 text-sm font-semibold text-navy hover:border-navy/40"
            >
              <Phone />
              Hemen arayın
            </a>
          </div>
        </div>

        <a
          href={STORE_INFO.phoneHref}
          className="flex items-center gap-x-4 self-start rounded-2xl border border-white bg-white/80 px-5 py-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)] backdrop-blur small:self-center"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-brand-fg">
            <Phone className="h-6 w-6" />
          </span>
          <span className="flex flex-col">
            <span className="text-xs text-muted">Müşteri hizmetleri</span>
            <span className="text-xl font-bold tracking-tight text-navy small:text-2xl">
              {STORE_INFO.phone}
            </span>
            <span className="text-[11px] text-muted">
              <span className="flex flex-col">
                {STORE_INFO.workingHours.split(", ").map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </span>
            </span>
          </span>
        </a>
      </div>
    </div>
  </div>
)

export default HelpBand
