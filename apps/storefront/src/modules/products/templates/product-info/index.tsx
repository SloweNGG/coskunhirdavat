import { ProductReviews } from "@lib/data/reviews"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { ProductQuickActions } from "@modules/products/components/product-actions/product-share"
import Stars from "@modules/products/components/product-reviews/stars"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
  reviews?: ProductReviews
}

const ProductInfo = ({ product, reviews }: ProductInfoProps) => {
  return (
    <div id="product-info" className="flex flex-col gap-y-2">
      {product.collection && (
        <LocalizedClientLink
          href={`/collections/${product.collection.handle}`}
          className="w-fit font-mono text-xs font-medium uppercase tracking-wider text-brand-ink hover:underline"
        >
          {product.collection.title}
        </LocalizedClientLink>
      )}
      <div className="flex items-start justify-between gap-4">
        <h1
          className="text-2xl font-semibold leading-tight text-navy small:text-3xl"
          data-testid="product-title"
        >
          {product.title}
        </h1>
        <ProductQuickActions productId={product.id} title={product.title} />
      </div>
      {!!reviews?.count && (
        <a href="#product-tabs" className="flex w-fit items-center gap-2 text-sm text-muted hover:text-navy">
          <Stars rating={reviews.average_rating} />
          <span>
            {reviews.average_rating.toLocaleString("tr-TR")} ({reviews.count} değerlendirme)
          </span>
        </a>
      )}
      {product.subtitle && (
        <p className="text-sm text-muted">{product.subtitle}</p>
      )}
    </div>
  )
}

export default ProductInfo
