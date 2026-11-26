import { ArrowRight, BuildingStorefront, ChatBubbleLeftRight } from "@medusajs/icons"
import { STORE_INFO } from "@lib/store-config"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const PromoBanners = () => {
  return (
    <section className="content-container py-4">
      <div className="grid grid-cols-1 gap-4 small:grid-cols-2 small:gap-5">
        <LocalizedClientLink
          href="/contact"
          className="group relative flex items-center gap-6 overflow-hidden rounded-xl bg-navy p-8 text-white"
        >
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white/10">
            <BuildingStorefront className="h-8 w-8" />
          </span>
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-bold">Toplu alımlarda özel fiyat</h3>
            <p className="text-sm text-white/75">
              Usta, şantiye ve firmalar için size özel teklif hazırlayalım.
            </p>
            <span className="mt-2 flex items-center gap-x-1 text-sm font-semibold text-brand-bright group-hover:underline">
              Teklif isteyin <ArrowRight />
            </span>
          </div>
        </LocalizedClientLink>
        <a
          href={STORE_INFO.whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="group relative flex items-center gap-6 overflow-hidden rounded-xl bg-whatsapp p-8 text-navy transition-colors hover:bg-whatsapp-dark"
        >
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-black/10">
            <ChatBubbleLeftRight className="h-8 w-8" />
          </span>
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-bold">WhatsApp&apos;tan sipariş verin</h3>
            <p className="text-sm opacity-90">
              Aradığınız ürünü bulamadınız mı? Yazın, sizin için bulalım.
            </p>
            <span className="mt-2 flex items-center gap-x-1 text-sm font-semibold group-hover:underline">
              Mesaj gönderin <ArrowRight />
            </span>
          </div>
        </a>
      </div>
    </section>
  )
}

export default PromoBanners
