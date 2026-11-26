"use client"

import { addToCart } from "@lib/data/cart"
import { getCustomerVariantPrices } from "@lib/data/products"
import { useIntersection } from "@lib/hooks/use-in-view"
import { notifyCartUpdated } from "@lib/util/cart-events"
import { isVariantInStock } from "@lib/util/inventory"
import { HttpTypes } from "@medusajs/types"
import {
  CheckCircleSolid,
  CreditCard,
  TruckFast,
  XCircleSolid,
} from "@medusajs/icons"
import { clx } from "@modules/common/components/ui"
import {
  FREE_SHIPPING_THRESHOLD,
  SHOW_BUY_NOW,
  STORE_INFO,
} from "@lib/store-config"
import { getProductPrice } from "@lib/util/get-product-price"
import { convertToLocale } from "@lib/util/money"
import { qualifiesForFreeShipping } from "@modules/common/components/free-shipping-badge"
import { Button } from "@modules/common/components/ui"
import ProductShare from "./product-share"
import QuantityInput from "./quantity-input"
import RestockForm from "./restock-form"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { isEqual } from "lodash"
import { useParams, usePathname } from "next/navigation"
import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import ProductPrice from "../product-price"
import MobileActions from "./mobile-actions"
import { useRouter } from "next/navigation"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt) => {
    if (varopt.option_id) acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

const getDefaultVariant = (product: HttpTypes.StoreProduct) =>
  product.variants?.find(isVariantInStock) ?? product.variants?.[0]

export default function ProductActions({
  product: baseProduct,
  disabled,
}: ProductActionsProps) {
  const countryCodeParam = useParams().countryCode as string
  // Logged-in customers may have group prices (e.g. Usta); the static page has guest prices.
  const [customerPrices, setCustomerPrices] =
    useState<Awaited<ReturnType<typeof getCustomerVariantPrices>>>(null)
  useEffect(() => {
    let cancelled = false
    getCustomerVariantPrices(baseProduct.id, countryCodeParam)
      .then((prices) => {
        if (!cancelled && prices) setCustomerPrices(prices)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [baseProduct.id, countryCodeParam])
  const product = useMemo<HttpTypes.StoreProduct>(
    () =>
      customerPrices
        ? {
            ...baseProduct,
            variants: (baseProduct.variants ?? []).map((v) =>
              customerPrices[v.id]
                ? { ...v, calculated_price: customerPrices[v.id] }
                : v
            ),
          }
        : baseProduct,
    [baseProduct, customerPrices]
  )
  const router = useRouter()
  const pathname = usePathname()
  // Preselected on the server so the form posts a valid variant without JavaScript.
  // The page is statically rendered, so `?v_id=` is applied after hydration.
  const [options, setOptions] = useState<Record<string, string | undefined>>(
    () => optionsAsKeymap(getDefaultVariant(product)?.options ?? null) ?? {}
  )
  const [isUrlVariantApplied, setIsUrlVariantApplied] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const countryCode = useParams().countryCode as string

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // update the options when a variant is selected
  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  //check if the selected options produce a valid variant
  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  useEffect(() => {
    const variantId = new URLSearchParams(window.location.search).get("v_id")
    const variant = product.variants?.find((v) => v.id === variantId)
    if (variant) {
      setOptions(optionsAsKeymap(variant.options) ?? {})
    }
    setIsUrlVariantApplied(true)
  }, [product.variants])

  useEffect(() => {
    if (!isUrlVariantApplied) {
      return
    }

    const params = new URLSearchParams(window.location.search)
    const value = isValidVariant ? selectedVariant?.id : null

    if (params.get("v_id") === value) {
      return
    }

    if (value) {
      params.set("v_id", value)
    } else {
      params.delete("v_id")
    }

    router.replace(pathname + "?" + params.toString())
  }, [selectedVariant, isValidVariant, isUrlVariantApplied])

  const inStock = useMemo(
    () => isVariantInStock(selectedVariant),
    [selectedVariant]
  )

  // Only cap the stepper when stock is tracked and backorders are off.
  const maxQuantity =
    selectedVariant?.manage_inventory && !selectedVariant.allow_backorder
      ? Math.max(1, selectedVariant.inventory_quantity ?? 1)
      : 999

  const cannotBuy =
    !inStock || !selectedVariant || !!disabled || isAdding || !isValidVariant

  const showRestock = !!selectedVariant && !!isValidVariant && !inStock

  const actionsRef = useRef<HTMLDivElement>(null)

  const inView = useIntersection(actionsRef, "0px")

  // add the selected variant to the cart
  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null

    setIsAdding(true)

    await addToCart({
      variantId: selectedVariant.id,
      quantity: Math.min(quantity, maxQuantity),
      countryCode,
    })
    notifyCartUpdated()

    setIsAdding(false)
  }

  // add to cart, then go straight to checkout
  const handleBuyNow = async () => {
    if (!selectedVariant?.id) return
    await handleAddToCart()
    router.push(`/${countryCode}/checkout?step=address`)
  }

  // option value -> image of a variant that has it (for colour swatches)
  const optionImages = useMemo(() => {
    const map: Record<string, Record<string, string>> = {}
    for (const option of product.options ?? []) {
      const images: Record<string, string> = {}
      for (const value of option.values ?? []) {
        const variant = product.variants?.find((v) =>
          v.options?.some(
            (o) => o.option_id === option.id && o.value === value.value
          )
        )
        const url = variant?.images?.[0]?.url
        if (url) images[value.value] = url
      }
      const urls = Object.values(images)
      // only worth showing when every value has its own picture
      if (
        urls.length === (option.values?.length ?? 0) &&
        new Set(urls).size === urls.length
      ) {
        map[option.id] = images
      }
    }
    return map
  }, [product.options, product.variants])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    handleAddToCart()
  }

  return (
    <>
      <div className="flex flex-col gap-y-4" ref={actionsRef}>
        <form
          method="post"
          action={`/${countryCode}/cart/add`}
          onSubmit={handleSubmit}
          className="flex flex-col gap-y-4"
          {...{
            toolname: "add_to_cart",
            tooldescription:
              "Add the selected product variant to the shopping cart",
          }}
        >
          <input type="hidden" name="product_id" value={product.id} />
          <input
            type="hidden"
            name="variant_id"
            value={isValidVariant ? selectedVariant?.id ?? "" : ""}
          />
          <input
            type="hidden"
            name="quantity"
            value={Math.min(quantity, maxQuantity)}
          />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            {selectedVariant && isValidVariant && (
              <span
                className={clx(
                  "flex items-center gap-1.5 font-semibold",
                  inStock ? "text-emerald-700" : "text-sale"
                )}
                data-testid="product-availability"
              >
                {inStock ? <CheckCircleSolid /> : <XCircleSolid />}
                {inStock ? "Stokta var" : "Stokta yok"}
              </span>
            )}
            {selectedVariant?.sku && (
              <span className="font-mono text-muted">
                Ürün kodu:{" "}
                <span className="font-medium text-navy">
                  {selectedVariant.sku}
                </span>
              </span>
            )}
          </div>

          <ProductPrice product={product} variant={selectedVariant} />

          {(product.variants?.length ?? 0) > 1 && (
            <div className="flex flex-col gap-y-5 border-t border-line pt-5">
              {(product.options || []).map((option) => (
                <OptionSelect
                  key={option.id}
                  option={option}
                  current={options[option.id]}
                  updateOption={setOptionValue}
                  title={option.title ?? ""}
                  name={`options[${option.id}]`}
                  data-testid="product-options"
                  disabled={!!disabled || isAdding}
                  images={optionImages[option.id]}
                />
              ))}
            </div>
          )}

          <div
            className={clx(
              "flex flex-col gap-y-3 border-t border-line pt-5",
              showRestock && "hidden"
            )}
          >
            <span className="text-sm font-medium text-navy">Adet</span>
            <div className="flex gap-3">
              <QuantityInput
                value={Math.min(quantity, maxQuantity)}
                onChange={setQuantity}
                max={maxQuantity}
                disabled={!!disabled || isAdding || !inStock}
              />
              <Button
                type="submit"
                disabled={cannotBuy}
                variant="primary"
                className="h-12 flex-1 !rounded-full text-base"
                isLoading={isAdding}
                data-testid="add-product-button"
              >
                {!selectedVariant
                  ? "Seçenek seçin"
                  : !inStock || !isValidVariant
                  ? "Stokta yok"
                  : "Sepete ekle"}
              </Button>
            </div>
            {SHOW_BUY_NOW && (
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={cannotBuy}
                className="h-12 w-full rounded-full bg-navy text-base font-semibold text-white shadow-[0_8px_20px_rgba(0,0,0,0.18)] transition-colors hover:bg-navy/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Hemen al
              </button>
            )}
          </div>
        </form>
        {showRestock && selectedVariant && (
          // keyed so a different variant starts with a fresh form
          <RestockForm
            key={selectedVariant.id}
            variantId={selectedVariant.id}
          />
        )}
        <ProductShare
          title={product.title}
          quoteText={`Merhaba, toplu alım için fiyat teklifi istiyorum.\nÜrün: ${
            product.title
          }${
            selectedVariant?.sku ? ` (${selectedVariant.sku})` : ""
          }\nAdet: ${Math.min(quantity, maxQuantity)}`}
        />
        <ul className="flex flex-col gap-2 rounded-2xl bg-soft p-4 text-sm text-navy/80">
          <li className="flex items-center gap-2">
            <CreditCard className="text-brand-ink" />
            {STORE_INFO.installmentText}
          </li>
          <li className="flex items-center gap-2">
            <TruckFast className="text-brand-ink" />
            {qualifiesForFreeShipping(
              getProductPrice({ product, variantId: selectedVariant?.id })
                .variantPrice?.calculated_price_number
            ) ? (
              <span className="font-semibold text-emerald-700">
                Bu üründe kargo bedava
              </span>
            ) : (
              <span>
                {convertToLocale({
                  amount: FREE_SHIPPING_THRESHOLD,
                  currency_code: "try",
                  maximumFractionDigits: 0,
                })}{" "}
                ve üzeri siparişlerde kargo bedava
              </span>
            )}
          </li>
        </ul>
        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
        />
      </div>
    </>
  )
}
