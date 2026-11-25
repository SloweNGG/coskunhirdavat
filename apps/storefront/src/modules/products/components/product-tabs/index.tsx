"use client"

import { ProductReviews as ProductReviewsData } from "@lib/data/reviews"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@modules/common/components/ui"
import { useState } from "react"
import ProductReviews from "../product-reviews"

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
}

const ProductTabs = ({
  product,
  reviews,
}: ProductTabsProps & { reviews: ProductReviewsData }) => {
  const [active, setActive] = useState(0)
  const TABS = [
    "Ürün Özellikleri",
    `Değerlendirmeler${reviews.count ? ` (${reviews.count})` : ""}`,
    "Kargo ve İade",
    "Ödeme Seçenekleri",
  ]

  return (
    <div className="w-full">
      <div
        role="tablist"
        className="flex gap-x-6 overflow-x-auto no-scrollbar border-b border-line"
      >
        {TABS.map((label, i) => (
          <button
            key={label}
            type="button"
            role="tab"
            id={`product-tab-${i}`}
            aria-selected={i === active}
            aria-controls={`product-panel-${i}`}
            onClick={() => setActive(i)}
            className={clx(
              "-mb-px whitespace-nowrap border-b-2 py-3 text-sm font-semibold transition-colors",
              i === active
                ? "border-brand text-navy"
                : "border-transparent text-muted hover:text-navy"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        id={`product-panel-${active}`}
        aria-labelledby={`product-tab-${active}`}
        className="py-6 text-sm leading-6 text-navy/80"
      >
        {active === 0 && <ProductInfoTab product={product} />}
        {active === 1 && <ProductReviews productId={product.id} data={reviews} />}
        {active === 2 && <ShippingInfoTab />}
        {active === 3 && <PaymentInfoTab />}
      </div>
    </div>
  )
}

const ProductInfoTab = ({ product }: ProductTabsProps) => {
  const specs = [
    ["Malzeme", product.material],
    ["Menşei", product.origin_country?.toUpperCase()],
    ["Tip", product.type?.value],
    ["Ağırlık", product.weight ? `${product.weight} g` : null],
    [
      "Ölçüler",
      product.length && product.width && product.height
        ? `${product.length} x ${product.width} x ${product.height} mm`
        : null,
    ],
  ].filter((row): row is [string, string] => !!row[1])

  return (
    <div className="grid grid-cols-1 gap-8 small:grid-cols-[1fr_minmax(0,380px)]">
      <p className="whitespace-pre-line" data-testid="product-description">
        {product.description || "Bu ürün için açıklama eklenmemiş."}
      </p>
      {specs.length > 0 && (
        <div>
          <h3 className="mb-3 font-semibold text-navy">Teknik bilgiler</h3>
          <dl className="overflow-hidden rounded-lg border border-line">
            {specs.map(([label, value]) => (
              <div
                key={label}
                className="grid grid-cols-2 gap-4 px-4 py-2.5 odd:bg-soft"
              >
                <dt className="text-muted">{label}</dt>
                <dd className="font-medium text-navy">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  )
}

const ShippingInfoTab = () => (
  <ul className="flex max-w-2xl list-disc flex-col gap-2 pl-5">
    <li>Siparişiniz hızla hazırlanır ve kargoya teslim edilir.</li>
    <li>Ürün ihtiyacınızı karşılamadıysa değişim talebinde bulunabilirsiniz.</li>
    <li>14 gün içinde iade hakkınız bulunur.</li>
  </ul>
)

const PaymentInfoTab = () => (
  <ul className="flex max-w-2xl list-disc flex-col gap-2 pl-5">
    <li>Kredi ve banka kartıyla PayTR güvencesinde 3D Secure ödeme.</li>
    <li>Kredi kartına taksit imkânı; taksit seçenekleri ödeme adımında gösterilir.</li>
  </ul>
)

export default ProductTabs
