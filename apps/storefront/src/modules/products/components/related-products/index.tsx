import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { HttpTypes } from "@medusajs/types"
import SectionHeading from "@modules/home/components/section-heading"
import Product from "../product-preview"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

export default async function RelatedProducts({
  product,
  countryCode,
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  // Same category first; fall back to collection and tags.
  const queryParams: HttpTypes.StoreProductListParams = {
    limit: 9,
    fields: "*variants.calculated_price,+variants.sku,*categories",
  }
  if (region?.id) {
    queryParams.region_id = region.id
  }
  const categoryIds = (product.categories ?? []).map((c) => c.id)
  if (categoryIds.length) {
    queryParams.category_id = categoryIds
  } else if (product.collection_id) {
    queryParams.collection_id = [product.collection_id]
  }
  if (!categoryIds.length && product.tags?.length) {
    queryParams.tag_id = product.tags
      .map((t) => t.id)
      .filter(Boolean) as string[]
  }
  queryParams.is_giftcard = false

  const fetchOthers = (params: HttpTypes.StoreProductListParams) =>
    listProducts({ queryParams: params, countryCode }).then(({ response }) =>
      response.products.filter((p) => p.id !== product.id).slice(0, 8)
    )

  let products = await fetchOthers(queryParams)
  if (!products.length) {
    // nothing related found: show newest products instead of an empty section
    products = await fetchOthers({
      limit: 9,
      fields: queryParams.fields,
      region_id: queryParams.region_id,
      order: "-created_at",
    })
  }

  if (!products.length) {
    return null
  }

  return (
    <section>
      <SectionHeading
        eyebrow="Benzer ürünler"
        title="Bunlar da ilginizi çekebilir"
        href={categoryIds.length ? `/categories/${product.categories![0].handle}` : "/store"}
      />
      <ul className="grid grid-cols-2 gap-3 small:grid-cols-4 small:gap-5">
        {products.map((p) => (
          <li key={p.id}>
            <Product region={region} product={p} />
          </li>
        ))}
      </ul>
    </section>
  )
}
