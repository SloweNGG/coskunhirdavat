import { Clock, Envelope, MapPin } from "@medusajs/icons"
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
  <h3 className="mb-4 text-sm font-semibold text-white">{children}</h3>
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
      <div className="bg-navy text-white/70">
        <div className="content-container grid grid-cols-1 gap-10 py-14 xsmall:grid-cols-2 medium:grid-cols-4">
          <div>
            <FooterHeading>Kategoriler</FooterHeading>
            <ul
              className="flex flex-col gap-2.5 text-sm"
              data-testid="footer-categories"
            >
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
                  <LocalizedClientLink
                    href={l.href}
                    className="hover:text-white"
                  >
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
                  <LocalizedClientLink
                    href={l.href}
                    className="hover:text-white"
                  >
                    {l.label}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <FooterHeading>Adres &amp; İletişim</FooterHeading>
            <ul className="-mt-4 flex flex-col gap-3.5 text-sm">
              <li className="flex items-start gap-x-3">
                <MapPin className="mt-0.5 shrink-0 text-brand-bright" />
                {STORE_INFO.address}
              </li>
              <li>
                <a
                  href={`mailto:${STORE_INFO.email}`}
                  className="flex items-center gap-x-3 hover:text-white"
                >
                  <Envelope className="shrink-0 text-brand-bright" />
                  {STORE_INFO.email}
                </a>
              </li>
              <li className="flex items-start gap-x-3">
                <Clock className="mt-0.5 shrink-0 text-brand-bright" />
                <span className="flex flex-col">
                  {STORE_INFO.workingHours.split(", ").map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </span>
              </li>
            </ul>
            <div className="mt-2">
              <Logo inverted />
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="content-container flex flex-col small:flex-row items-start small:items-center justify-between gap-4 py-6 text-xs">
            <p>
              © {new Date().getFullYear()} {STORE_INFO.name}. Tüm hakları
              saklıdır.
            </p>
            <PaymentLogos />
          </div>
        </div>
      </div>
    </footer>
  )
}
