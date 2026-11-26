import {
  ChatBubbleLeftRight,
  Clock,
  Envelope,
  MapPin,
  Phone,
} from "@medusajs/icons"
import { listCategories } from "@lib/data/categories"
import { STORE_INFO } from "@lib/store-config"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Logo from "@modules/layout/components/logo"
import PaymentLogos from "@modules/layout/components/payment-logos"

const INFO_LINKS = [
  { label: "Hakkımızda", href: "/contact" },
  { label: "Kargo ve Teslimat", href: "/shipping" },
  { label: "İade ve Değişim Koşulları", href: "/returns" },
  { label: "Kullanım Koşulları", href: "/terms" },
  { label: "Gizlilik ve KVKK", href: "/privacy" },
  { label: "İletişim", href: "/contact" },
]

const CUSTOMER_LINKS = [
  { label: "Hesabım", href: "/account" },
  { label: "Siparişlerim", href: "/account/orders" },
  { label: "Adreslerim", href: "/account/addresses" },
  { label: "Sepetim", href: "/cart" },
  { label: "Ürün Ara", href: "/search" },
]

const FooterHeading = ({ children }: { children: React.ReactNode }) => (
  <h3 className="mb-5 text-xs font-semibold uppercase tracking-[0.14em] text-brand-bright">
    {children}
  </h3>
)

/** A footer link with a short accent line that grows in on hover. */
const FooterLink = ({
  href,
  children,
  "data-testid": dataTestId,
}: {
  href: string
  children: React.ReactNode
  "data-testid"?: string
}) => (
  <LocalizedClientLink
    href={href}
    className="group/link inline-flex items-center transition-colors hover:text-white"
    data-testid={dataTestId}
  >
    <span className="mr-0 h-px w-0 bg-brand-bright transition-all duration-200 group-hover/link:mr-2 group-hover/link:w-3" />
    {children}
  </LocalizedClientLink>
)

const ContactIcon = ({ children }: { children: React.ReactNode }) => (
  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-brand-bright ring-1 ring-white/10">
    {children}
  </span>
)

/**
 * Site footer: a dark panel with rounded top corners. On the home page it
 * tucks under the help band right above it (`data-footer-overlap`), so the
 * band's colour, not the page's white, shows in the rounded corners.
 */
export default async function Footer() {
  const productCategories = await listCategories({
    fields: "id,name,handle,rank,parent_category_id",
  }).catch(() => [])

  const topCategories = (productCategories ?? [])
    .filter((c) => !c.parent_category_id)
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    .slice(0, 8)

  return (
    <footer className="relative w-full overflow-hidden rounded-t-[40px] bg-navy text-white/65 [[data-footer-overlap]+&]:-mt-10">
      {/* Soft accent glow in the top corner. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-brand/20 blur-3xl"
      />

      <div className="content-container relative grid grid-cols-2 gap-x-8 gap-y-12 pb-12 pt-16 small:grid-cols-4 medium:grid-cols-[1.55fr_1fr_1fr_1fr_1.3fr]">
        <div className="col-span-2 flex flex-col gap-5 small:col-span-4 medium:col-span-1">
          <Logo inverted />
          <p className="max-w-xs text-sm leading-relaxed">
            {STORE_INFO.tagline}. Ölçü aletlerinden kaynak malzemelerine,
            kaldırma ekipmanından ambalaja kadar atölye, şantiye ve depo için.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <a
              href={STORE_INFO.phoneHref}
              className="flex items-center gap-x-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              <Phone className="text-brand-bright" />
              {STORE_INFO.phone}
            </a>
            <a
              href={STORE_INFO.whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-x-2 rounded-full bg-whatsapp px-4 py-2 text-sm font-semibold text-navy transition-colors hover:bg-whatsapp-dark"
            >
              <ChatBubbleLeftRight />
              WhatsApp
            </a>
          </div>
        </div>

        <div>
          <FooterHeading>Kategoriler</FooterHeading>
          <ul
            className="flex flex-col gap-3 text-sm"
            data-testid="footer-categories"
          >
            {topCategories.map((c) => (
              <li key={c.id}>
                <FooterLink
                  href={`/categories/${c.handle}`}
                  data-testid="category-link"
                >
                  {c.name}
                </FooterLink>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <FooterHeading>Önemli Bilgiler</FooterHeading>
          <ul className="flex flex-col gap-3 text-sm">
            {INFO_LINKS.map((l) => (
              <li key={l.label}>
                <FooterLink href={l.href}>{l.label}</FooterLink>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <FooterHeading>Müşteri Hizmetleri</FooterHeading>
          <ul className="flex flex-col gap-3 text-sm">
            {CUSTOMER_LINKS.map((l) => (
              <li key={l.label}>
                <FooterLink href={l.href}>{l.label}</FooterLink>
              </li>
            ))}
          </ul>
        </div>

        {/* Full width on phones, where half a column can't fit the email. */}
        <div className="col-span-2 small:col-span-1">
          <FooterHeading>Adres &amp; İletişim</FooterHeading>
          <ul className="flex flex-col gap-4 text-sm">
            <li className="flex items-start gap-x-3">
              <ContactIcon>
                <MapPin />
              </ContactIcon>
              <span className="pt-1.5 leading-snug">{STORE_INFO.address}</span>
            </li>
            <li>
              <a
                href={`mailto:${STORE_INFO.email}`}
                className="flex items-center gap-x-3 transition-colors hover:text-white"
              >
                <ContactIcon>
                  <Envelope />
                </ContactIcon>
                {STORE_INFO.email}
              </a>
            </li>
            <li className="flex items-start gap-x-3">
              <ContactIcon>
                <Clock />
              </ContactIcon>
              <span className="flex flex-col pt-1.5 leading-snug">
                {STORE_INFO.workingHours.split(", ").map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className="content-container flex flex-col items-start justify-between gap-4 py-6 text-xs small:flex-row small:items-center">
          <p>
            © {new Date().getFullYear()} {STORE_INFO.name}. Tüm hakları
            saklıdır.
          </p>
          <PaymentLogos />
        </div>
      </div>
    </footer>
  )
}
