import { HttpTypes } from "@medusajs/types"

export const isVariantInStock = (
  variant: HttpTypes.StoreProductVariant | undefined
) =>
  !!variant &&
  (!variant.manage_inventory ||
    !!variant.allow_backorder ||
    (variant.inventory_quantity ?? 0) > 0)

/**
 * True when none of the product's variants can be bought. Unknown counts as
 * in stock: variants not fetched, or a tracked variant whose
 * inventory_quantity was not requested (lists that pass their own `fields`).
 */
export const isProductOutOfStock = (product: {
  variants?: HttpTypes.StoreProductVariant[] | null
}) =>
  !!product.variants?.length &&
  product.variants.every(
    (variant) =>
      !isVariantInStock(variant) &&
      typeof variant.inventory_quantity === "number"
  )
