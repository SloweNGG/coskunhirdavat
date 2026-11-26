import { clx } from "@modules/common/components/ui"
import { VariantPrice } from "types/global"
import PriceText from "@modules/common/components/price-text"

export default function PreviewPrice({ price }: { price: VariantPrice }) {
  if (!price) {
    return null
  }

  const isSale = price.price_type === "sale"

  return (
    <div className="flex items-baseline gap-x-2">
      {isSale && (
        <span
          className="text-[15px] font-semibold text-muted line-through"
          data-testid="original-price"
        >
          <PriceText value={price.original_price} />
        </span>
      )}
      <span
        className={clx("text-[22px] font-bold leading-none", isSale ? "text-sale" : "text-navy")}
        data-testid="price"
      >
        <PriceText value={price.calculated_price} />
      </span>
    </div>
  )
}
