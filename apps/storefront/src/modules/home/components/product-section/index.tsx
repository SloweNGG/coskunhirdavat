import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import ProductPreview from "@modules/products/components/product-preview"
import SectionHeading from "../section-heading"

export default async function ProductSection({
  title,
  subtitle,
  eyebrow,
  href = "/store",
  region,
  order,
  limit = 8,
}: {
  title: string
  subtitle?: string
  eyebrow?: string
  href?: string
  region: HttpTypes.StoreRegion
  order?: string
  limit?: number
}) {
  const {
    response: { products },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      limit,
      order,
      fields: "*variants.calculated_price,+variants.sku,*categories",
    },
  }).catch(() => ({ response: { products: [] as HttpTypes.StoreProduct[] } }))

  if (!products.length) {
    return null
  }

  return (
    <section className="content-container py-10 small:py-14">
      <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} href={href} />
      <ul className="grid grid-cols-2 gap-3 small:grid-cols-4 small:gap-5">
        {products.map((product) => (
          <li key={product.id}>
            <ProductPreview product={product} region={region} />
          </li>
        ))}
      </ul>
    </section>
  )
}
