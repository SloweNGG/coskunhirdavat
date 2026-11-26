import { HttpTypes } from "@medusajs/types"
import { Metadata } from "next"
import { notFound } from "next/navigation"

import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { searchCatalog } from "@lib/data/search"
import { searchHelpMessage, whatsappLink } from "@lib/store-config"
import StoreIcon from "@modules/common/components/store-icon"
import ProductPreview from "@modules/products/components/product-preview"
import SearchForm from "@modules/search/components/search-form"
import { Pagination } from "@modules/store/components/pagination"

const RESULT_LIMIT = 24

type Props = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>
}

const first = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value

const getQuery = (q?: string | string[]) =>
  first(q)?.trim().slice(0, 200) ?? ""

const getPage = (page?: string | string[]) =>
  Math.max(1, Number.parseInt(first(page) ?? "", 10) || 1)

type Results = {
  products: HttpTypes.StoreProduct[]
  total: number
  query: string
  correctedFrom: string | null
}

/**
 * Same search as the header box (the product index, typo fallback included),
 * so its "all results" count matches this page. The index gives the ids in
 * relevance order; the store API gives the products with region prices. If
 * the index is unreachable, the store API's own text search stands in.
 */
const findProducts = async (
  query: string,
  page: number,
  countryCode: string
): Promise<Results> => {
  try {
    const search = await searchCatalog(query, {
      take: RESULT_LIMIT,
      skip: (page - 1) * RESULT_LIMIT,
      fields: ["id"],
    })
    const ids = search.hits.map((hit) => hit.id)
    const { response } = ids.length
      ? await listProducts({
          countryCode,
          queryParams: { id: ids, limit: ids.length },
        })
      : { response: { products: [] } }
    const byId = new Map(response.products.map((p) => [p.id, p]))

    return {
      products: ids.flatMap((id) => byId.get(id) ?? []),
      total: search.total,
      query: search.query,
      correctedFrom: search.correctedFrom,
    }
  } catch {
    const { response } = await listProducts({
      pageParam: page,
      countryCode,
      queryParams: { q: query, limit: RESULT_LIMIT },
    })
    return {
      products: response.products,
      total: response.count,
      query,
      correctedFrom: null,
    }
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const query = getQuery((await props.searchParams).q)
  return {
    title: query ? `"${query}" için arama sonuçları` : "Ürün Ara",
    robots: { index: false, follow: true },
  }
}

export default async function SearchPage(props: Props) {
  const { countryCode } = await props.params
  const searchParams = await props.searchParams
  const query = getQuery(searchParams.q)
  const page = getPage(searchParams.page)

  const region = await getRegion(countryCode)
  if (!region) {
    notFound()
  }

  const results = query ? await findProducts(query, page, countryCode) : null
  const totalPages = results ? Math.ceil(results.total / RESULT_LIMIT) : 0

  return (
    <div className="content-container py-6" data-testid="search-container">
      <h1 className="text-2xl-semi mb-6 text-navy">
        {results ? `"${results.query}" için arama sonuçları` : "Ürün Ara"}
      </h1>
      <SearchForm
        countryCode={countryCode}
        defaultValue={results?.query ?? query}
        className="mb-8 max-w-xl"
      />
      {results?.correctedFrom && (
        <p className="mb-4 text-sm text-navy">
          &quot;{results.correctedFrom}&quot; için sonuç bulunamadı,{" "}
          <strong className="font-semibold text-brand-ink">
            &quot;{results.query}&quot;
          </strong>{" "}
          sonuçları gösteriliyor.
        </p>
      )}
      {results && (
        <p className="text-small-regular text-ui-fg-subtle mb-6">
          {results.total} ürün bulundu
        </p>
      )}
      {results && results.products.length === 0 ? (
        <div className="rounded-xl border border-line bg-soft p-6">
          <p className="font-semibold text-navy">Aradığınız ürünü bulamadık.</p>
          <p className="text-sm text-muted">
            Yazımı kontrol edin ya da daha genel bir kelime deneyin.
          </p>
          <a
            href={whatsappLink(searchHelpMessage(query))}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex h-10 items-center gap-x-2 rounded-full bg-whatsapp px-4 text-sm font-semibold text-navy transition-colors hover:bg-whatsapp-dark"
          >
            <StoreIcon name="chat" className="h-4 w-4" />
            WhatsApp’tan sorun, sizin için bulalım
          </a>
        </div>
      ) : (
        <ul
          className="grid grid-cols-2 w-full small:grid-cols-3 medium:grid-cols-4 gap-3 small:gap-5"
          data-testid="search-results"
        >
          {results?.products.map((product) => (
            <li key={product.id}>
              <ProductPreview product={product} region={region} />
            </li>
          ))}
        </ul>
      )}
      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          data-testid="search-pagination"
        />
      )}
    </div>
  )
}
