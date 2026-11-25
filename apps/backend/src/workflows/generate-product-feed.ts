import {
  ContainerRegistrationKeys,
  QueryContext,
  getVariantAvailability,
} from "@medusajs/framework/utils"
import {
  StepResponse,
  WorkflowResponse,
  createStep,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"

// Adapted from https://github.com/medusajs/examples/tree/main/product-feed

export type GenerateProductFeedInput = {
  currency_code: string
  country_code: string
}

const DEFAULT_BRAND = "Coşkun Hırdavat"

const escapeXml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    // Strip characters that are invalid in XML 1.0
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")

// Google expects "1026.00 TRY" (dot decimal, ISO currency).
const formatPrice = (amount: number, currency: string) =>
  `${Number(amount).toFixed(2)} ${currency.toUpperCase()}`

const tag = (name: string, value?: string | null) =>
  value ? `<${name}>${escapeXml(value)}</${name}>` : ""

const buildProductFeedStep = createStep(
  "build-product-feed",
  async (input: GenerateProductFeedInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const storefrontUrl = (
      process.env.STOREFRONT_URL || "http://localhost:8001"
    ).replace(/\/$/, "")
    const country = input.country_code.toLowerCase()
    const currency = input.currency_code.toLowerCase()

    const items: string[] = []
    const take = 100
    let skip = 0
    let count = 0

    do {
      const { data: products, metadata } = await query.graph({
        entity: "product",
        fields: [
          "id",
          "title",
          "subtitle",
          "description",
          "handle",
          "thumbnail",
          "metadata",
          "images.url",
          "variants.id",
          "variants.title",
          "variants.sku",
          "variants.barcode",
          "variants.ean",
          "variants.upc",
          "variants.manage_inventory",
          "variants.allow_backorder",
          "variants.calculated_price.*",
          "sales_channels.id",
          "sales_channels.stock_locations.address.country_code",
        ],
        filters: { status: "published" },
        context: {
          variants: {
            calculated_price: QueryContext({ currency_code: currency }),
          },
        },
        pagination: { take, skip },
      })
      count = metadata?.count ?? 0
      skip += take

      for (const product of products) {
        if (!product.variants?.length) continue

        const salesChannel = product.sales_channels?.find((sc) =>
          sc?.stock_locations?.some(
            (l) => l?.address?.country_code?.toLowerCase() === country
          )
        )
        const availability = salesChannel
          ? await getVariantAvailability(query, {
              variant_ids: product.variants.map((v) => v.id),
              sales_channel_id: salesChannel.id,
            })
          : undefined

        const brand =
          (product.metadata?.brand as string | undefined) || DEFAULT_BRAND
        const images = (product.images ?? []).map((i) => i?.url).filter(Boolean)
        const multiVariant = product.variants.length > 1

        for (const variant of product.variants) {
          // calculated_price is added by the query context, not typed on the model
          const price = (variant as { calculated_price?: unknown }).calculated_price as
            | { calculated_amount?: number | null; original_amount?: number | null }
            | undefined
          // Variants without a price in this currency cannot be listed.
          if (price?.calculated_amount == null) continue

          const original = price.original_amount ?? price.calculated_amount
          const onSale = original > price.calculated_amount
          const inStock =
            !variant.manage_inventory ||
            variant.allow_backorder ||
            (availability?.[variant.id]?.availability ?? 0) > 0
          const gtin = variant.barcode || variant.ean || variant.upc

          items.push(
            "<item>" +
              tag("g:id", variant.id) +
              tag(
                "title",
                multiVariant && variant.title
                  ? `${product.title} - ${variant.title}`
                  : product.title
              ) +
              tag("description", product.description || product.subtitle || product.title) +
              tag(
                "link",
                `${storefrontUrl}/${country}/products/${product.handle}`
              ) +
              tag("g:image_link", product.thumbnail || images[0]) +
              images
                .slice(0, 10)
                .map((url) => tag("g:additional_image_link", url))
                .join("") +
              tag("g:availability", inStock ? "in_stock" : "out_of_stock") +
              tag("g:price", formatPrice(original, currency)) +
              (onSale
                ? tag("g:sale_price", formatPrice(price.calculated_amount, currency))
                : "") +
              tag("g:condition", "new") +
              tag("g:brand", brand) +
              tag("g:gtin", gtin) +
              tag("g:mpn", variant.sku) +
              (gtin || variant.sku ? "" : tag("g:identifier_exists", "no")) +
              tag("g:item_group_id", product.id) +
              "</item>"
          )
        }
      }
    } while (skip < count)

    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>` +
      `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">` +
      `<channel>` +
      tag("title", DEFAULT_BRAND) +
      tag("link", storefrontUrl) +
      tag("description", "Coşkun Hırdavat ürün feed'i (Google Merchant Center)") +
      items.join("") +
      `</channel></rss>`

    return new StepResponse({ xml })
  }
)

export const generateProductFeedWorkflow = createWorkflow(
  "generate-product-feed",
  (input: GenerateProductFeedInput) =>
    new WorkflowResponse(buildProductFeedStep(input))
)
