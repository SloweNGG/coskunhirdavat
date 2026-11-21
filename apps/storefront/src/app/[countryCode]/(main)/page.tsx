import { Metadata } from "next"

import CategoryGrid from "@modules/home/components/category-grid"
import Hero from "@modules/home/components/hero"
import PartFinder from "@modules/home/components/part-finder"
import ProductSection from "@modules/home/components/product-section"
import ProjectGrid from "@modules/home/components/project-grid"
import PromoBanners from "@modules/home/components/promo-banners"
import UspStrip from "@modules/home/components/usp-strip"
import { listCategories } from "@lib/data/categories"
import { getRegion, listRegions } from "@lib/data/regions"
import { toJsonLd } from "@lib/util/product-structured-data"
import { getSiteOrigin, listCountryCodes, STORE_NAME } from "@lib/util/site"
import { buildRegionsReturnPolicies } from "@lib/util/store-policies"

export const dynamic = "force-static"
export const revalidate = 60

export async function generateMetadata(props: {
  params: Promise<{ countryCode: string }>
}): Promise<Metadata> {
  const { countryCode } = await props.params
  const [origin, regions] = await Promise.all([getSiteOrigin(), listRegions()])

  return {
    title: `${STORE_NAME} | Hırdavat, El Aletleri ve Yapı Malzemeleri`,
    description:
      "El aletleri, elektrikli aletler, bağlantı elemanları, iş güvenliği ve yapı malzemeleri uygun fiyat, taksit ve hızlı kargo ile.",
    alternates: {
      canonical: `${origin}/${countryCode}`,
      languages: {
        ...Object.fromEntries(
          listCountryCodes(regions).map((code) => [
            `tr-${code.toUpperCase()}`,
            `${origin}/${code}`,
          ])
        ),
        "x-default": origin,
      },
    },
  }
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const categories = await listCategories({
    fields: "id,name,handle,rank,parent_category_id",
  })
    .then((list) =>
      list
        .filter((c) => !c.parent_category_id)
        .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    )
    .catch(() => [])

  const [origin, regions] = await Promise.all([getSiteOrigin(), listRegions()])
  const homeUrl = `${origin}/${countryCode}`
  const returnPolicies = buildRegionsReturnPolicies(regions)
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: STORE_NAME,
      url: origin,
      ...(returnPolicies.length
        ? { hasMerchantReturnPolicy: returnPolicies }
        : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: STORE_NAME,
      url: homeUrl,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${homeUrl}/search?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: toJsonLd(structuredData) }}
      />
      <Hero />
      <CategoryGrid categories={categories} />
      <ProjectGrid />
      <PartFinder />
      <UspStrip />
      <ProductSection
        eyebrow="03 / En çok tercih edilenler"
        title="Çok Satanlar"
        subtitle="Ustaların en çok tercih ettiği ürünler"
        region={region}
      />
      <PromoBanners />
      <ProductSection
        eyebrow="04 / Rafa yeni girenler"
        title="Yeni Ürünler"
        subtitle="Mağazamıza yeni eklenen ürünler"
        region={region}
        order="-created_at"
      />
    </>
  )
}
