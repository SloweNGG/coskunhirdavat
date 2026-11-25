import React, { Suspense } from "react"

import VariantImageGallery from "@modules/products/components/image-gallery/variant-image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductTabs from "@modules/products/components/product-tabs"
import RecentlyViewed from "@modules/products/components/recently-viewed"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"
import { ProductReviews } from "@lib/data/reviews"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  reviews: ProductReviews
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  reviews,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  const category = product.categories?.[0]

  return (
    <>
      <div className="content-container pt-5 pb-10" data-testid="product-container">
        <nav aria-label="Sayfa yolu" className="mb-5">
          <ol className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
            <li>
              <LocalizedClientLink href="/" className="hover:text-navy">
                Ana Sayfa
              </LocalizedClientLink>
            </li>
            {category && (
              <>
                <li aria-hidden>/</li>
                <li>
                  <LocalizedClientLink
                    href={`/categories/${category.handle}`}
                    className="hover:text-navy"
                  >
                    {category.name}
                  </LocalizedClientLink>
                </li>
              </>
            )}
            <li aria-hidden>/</li>
            <li className="font-medium text-navy" aria-current="page">
              {product.title}
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 gap-8 small:grid-cols-2 large:gap-12">
          <div className="relative small:sticky small:top-6 small:self-start">
            <VariantImageGallery product={product} />
          </div>
          <div className="flex flex-col gap-y-5">
            <ProductInfo product={product} reviews={reviews} />
            <ProductOnboardingCta />
            <ProductActions product={product} region={region} />
          </div>
        </div>

        <div id="product-tabs" className="mt-12 scroll-mt-24 small:mt-16">
          <ProductTabs product={product} reviews={reviews} />
        </div>
      </div>
      <div
        className="content-container mb-16 small:mb-24"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
        <RecentlyViewed currentId={product.id} className="mt-14" />
      </div>
    </>
  )
}

export default ProductTemplate
