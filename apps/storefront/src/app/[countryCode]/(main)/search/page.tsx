import { Metadata } from "next"
import { notFound } from "next/navigation"

import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductPreview from "@modules/products/components/product-preview"
import SearchForm from "@modules/search/components/search-form"
import { Camera } from "@medusajs/icons"
import { PART_FINDER_MESSAGE, whatsappLink } from "@lib/store-config"

const RESULT_LIMIT = 24

type Props = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ q?: string | string[] }>
}

const getQuery = (q?: string | string[]) =>
  (Array.isArray(q) ? q[0] : q)?.trim().slice(0, 200) ?? ""

export async function generateMetadata(props: Props): Promise<Metadata> {
  const query = getQuery((await props.searchParams).q)
  return {
    title: query ? `"${query}" için arama sonuçları` : "Ürün Ara",
    robots: { index: false, follow: true },
  }
}

export default async function SearchPage(props: Props) {
  const { countryCode } = await props.params
  const query = getQuery((await props.searchParams).q)

  const region = await getRegion(countryCode)
  if (!region) {
    notFound()
  }

  const { response } = query
    ? await listProducts({
        countryCode,
        queryParams: { q: query, limit: RESULT_LIMIT },
      })
    : { response: { products: [], count: 0 } }

  return (
    <div className="content-container py-6" data-testid="search-container">
      <h1 className="text-2xl-semi mb-6 text-navy">
        {query ? `"${query}" için arama sonuçları` : "Ürün Ara"}
      </h1>
      <SearchForm countryCode={countryCode} defaultValue={query} className="mb-8 max-w-xl" />
      {query && (
        <p className="text-small-regular text-ui-fg-subtle mb-6">
          {response.count} ürün bulundu
        </p>
      )}
      {query && response.products.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-xl border border-line bg-soft p-6 small:flex-row small:items-center small:justify-between">
          <div>
            <p className="font-semibold text-navy">
              Aradığınız ürünü bulamadık.
            </p>
            <p className="text-sm text-muted">
              Farklı bir kelime deneyin ya da ürünün fotoğrafını gönderin, sizin
              için bulalım.
            </p>
          </div>
          <a
            href={whatsappLink(`${PART_FINDER_MESSAGE} (Aradığım: ${query})`)}
            target="_blank"
            rel="noreferrer"
            className="flex shrink-0 items-center gap-x-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-brand-fg hover:bg-brand-dark"
          >
            <Camera />
            Fotoğraf Gönder
          </a>
        </div>
      ) : (
        <ul
          className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-3 small:gap-5"
          data-testid="search-results"
        >
          {response.products.map((product) => (
            <li key={product.id}>
              <ProductPreview product={product} region={region} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
