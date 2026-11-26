"use client"

import { indexedCurrency, priceAttribute } from "@lib/search-client"
import { convertToLocale } from "@lib/util/money"
import { Text, clx } from "@modules/common/components/ui"
import PriceText from "@modules/common/components/price-text"

/** The per-currency price fields a hit may carry, e.g. `min_price_eur`. */
export type HitPricing = Record<string, unknown>

type HitPriceProps = {
  hit: HitPricing
  currencyCode: string
}

const amount = (value: unknown) => (typeof value === "number" ? value : null)

const HitPrice = ({ hit, currencyCode }: HitPriceProps) => {
  const currency_code = indexedCurrency(currencyCode)
  const min_price = amount(hit[priceAttribute("min_price", currencyCode)])
  const max_price = amount(hit[priceAttribute("max_price", currencyCode)])
  const original_price = amount(
    hit[priceAttribute("original_price", currencyCode)]
  )
  const on_sale = hit[priceAttribute("on_sale", currencyCode)] === true

  if (min_price === null) {
    return null
  }

  const format = (value: number) =>
    convertToLocale({ amount: value, currency_code })

  const max = max_price ?? min_price
  const isRange = max > min_price

  return (
    <div className="flex items-center gap-x-2" data-testid="product-price">
      {!isRange && on_sale && original_price !== null && (
        <Text
          className="text-[15px] font-semibold line-through text-muted"
          data-testid="original-price"
        >
          <PriceText value={format(original_price)} />
        </Text>
      )}
      <Text
        className={clx("text-[22px] font-bold leading-none", on_sale ? "text-sale" : "text-navy")}
        data-testid="price"
      >
        {isRange ? (
          <>
            <PriceText value={format(min_price)} /> -{" "}
            <PriceText value={format(max)} />
          </>
        ) : (
          <PriceText value={format(min_price)} />
        )}
      </Text>
    </div>
  )
}

export default HitPrice
