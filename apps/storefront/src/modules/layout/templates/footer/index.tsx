import { ChatBubbleLeftRight, Clock, Envelope, MapPin, Phone } from "@medusajs/icons"
import { listCategories } from "@lib/data/categories"
import { STORE_INFO } from "@lib/store-config"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Logo from "@modules/layout/components/logo"
import TapeMeasure from "@modules/common/components/tape-measure"

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

const PAYMENT_BADGES = ["VISA", "Mastercard", "TROY", "PayTR", "3D Secure"]

const FooterHeading = ({ children }: { children: React.ReactNode }) => (
  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
    {children}
  </h3>
)

export default async function Footer() {
  const productCategories = await listCategories({
    fields: "id,name,handle,rank,parent_category_id",
  }).catch(() => [])

  const topCategories = (productCategories ?? [])
    .filter((c) => !c.parent_category_id)
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    .slice(0, 8)

  return (
    <footer className="w-full">
      <TapeMeasure variant="band" />
      {/* Help strip */}
      <div className="bg-brand text-brand-fg">
        <div className="content-container flex flex-col small:flex-row items-start small:items-center justify-between gap-4 py-6">
          <div>
            <p className="text-lg font-semibold">Doğru ürünü bulmakta zorlanıyor musunuz?</p>
            <p className="text-sm opacity-80">
              Uzman ekibimiz size en uygun ürünü seçmenizde yardımcı olsun.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={STORE_INFO.phoneHref}
              className="flex items-center gap-x-2 rounded-lg bg-navy px-5 py-3 text-sm font-semibold text-white hover:bg-navy-light"
            >
              <Phone />
              Hemen Arayın
            </a>
            <a
              href={STORE_INFO.whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-x-2 rounded-lg border-2 border-current px-5 py-3 text-sm font-semibold hover:bg-black/5"
            >
              <ChatBubbleLeftRight />
              WhatsApp Destek
            </a>
          </div>
        </div>
      </div>

      <div className="bg-navy text-white/75">
        <div className="content-container grid grid-cols-1 gap-10 py-14 xsmall:grid-cols-2 medium:grid-cols-4">
          <div className="flex flex-col gap-4">
            <Logo inverted />
            <p className="text-sm leading-relaxed">
              {STORE_INFO.name}; el aletlerinden elektrikli aletlere, bağlantı
              elemanlarından iş güvenliğine kadar ihtiyacınız olan her şeyi uygun
              fiyat ve hızlı teslimatla sunar.
            </p>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li className="flex items-start gap-x-2">
                <MapPin className="mt-0.5" />
                {STORE_INFO.address}
              </li>
              <li>
                <a href={STORE_INFO.phoneHref} className="flex items-center gap-x-2 hover:text-white">
                  <Phone />
                  {STORE_INFO.phone}
                </a>
              </li>
              <li>
                <a href={`mailto:${STORE_INFO.email}`} className="flex items-center gap-x-2 hover:text-white">
                  <Envelope />
                  {STORE_INFO.email}
                </a>
              </li>
              <li className="flex items-start gap-x-2">
                <Clock className="mt-0.5" />
                {STORE_INFO.workingHours}
              </li>
            </ul>
          </div>

          <div>
            <FooterHeading>Kategoriler</FooterHeading>
            <ul className="flex flex-col gap-2.5 text-sm" data-testid="footer-categories">
              {topCategories.map((c) => (
                <li key={c.id}>
                  <LocalizedClientLink
                    href={`/categories/${c.handle}`}
                    className="hover:text-white"
                    data-testid="category-link"
                  >
                    {c.name}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <FooterHeading>Önemli Bilgiler</FooterHeading>
            <ul className="flex flex-col gap-2.5 text-sm">
              {INFO_LINKS.map((l) => (
                <li key={l.label}>
                  <LocalizedClientLink href={l.href} className="hover:text-white">
                    {l.label}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <FooterHeading>Müşteri Hizmetleri</FooterHeading>
            <ul className="flex flex-col gap-2.5 text-sm">
              {CUSTOMER_LINKS.map((l) => (
                <li key={l.label}>
                  <LocalizedClientLink href={l.href} className="hover:text-white">
                    {l.label}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="content-container flex flex-col small:flex-row items-start small:items-center justify-between gap-4 py-6 text-xs">
            <p>
              © {new Date().getFullYear()} {STORE_INFO.name}. Tüm hakları saklıdır.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1">Güvenli Ödeme:</span>
              {PAYMENT_BADGES.map((b) => (
                <span
                  key={b}
                  className="rounded border border-white/20 bg-white/5 px-2 py-1 font-semibold text-white/90"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
