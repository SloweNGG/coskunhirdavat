import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { cleanDescription, cleanSeoTitle } from "../lib/shopify-csv"

/**
 * Cleans descriptions of products imported from Shopify with the same rules
 * the importer now applies (see cleanDescription in src/lib/shopify-csv.ts):
 * links to the brand's web shop, its shipping policy and its seller promises
 * go; product facts stay. Also cleans the SEO fields and removes the original
 * HTML (metadata.description_html), which the store API and the page source
 * exposed. Safe to run more than once.
 *
 *   npx medusa exec ./src/scripts/clean-product-descriptions.ts [dry-run]
 */
const BATCH_SIZE = 20
const INGEST_CHUNK_SIZE = 25

type Metadata = Record<string, unknown>

const lineDiff = (before: string, after: string) => {
  const kept = new Set(after.split("\n"))
  return before.split("\n").filter((line) => line.trim() && !kept.has(line))
}

export default async function cleanProductDescriptions({ container, args }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const dryRun = args.includes("dry-run")

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "description", "metadata"],
  })

  const updates: { id: string; description?: string; metadata: Metadata }[] = []

  for (const product of products) {
    const metadata = (product.metadata ?? {}) as Metadata
    if (metadata.source !== "shopify") {
      continue
    }

    const before = product.description ?? ""
    const description = cleanDescription(before)
    const { description_html: html, ...rest } = metadata
    const nextMetadata: Metadata = { ...rest }
    if (html !== undefined) {
      // Product metadata updates are merged; an empty string deletes the key.
      nextMetadata.description_html = ""
    }
    if (typeof rest.seo_title === "string") {
      nextMetadata.seo_title = cleanSeoTitle(rest.seo_title)
    }
    if (typeof rest.seo_description === "string") {
      nextMetadata.seo_description = cleanDescription(rest.seo_description)
    }

    const descriptionChanged = description !== before
    const metadataChanged =
      html !== undefined ||
      nextMetadata.seo_title !== rest.seo_title ||
      nextMetadata.seo_description !== rest.seo_description
    if (!descriptionChanged && !metadataChanged) {
      continue
    }

    if (descriptionChanged) {
      for (const line of lineDiff(before, description)) {
        logger.info(`${product.handle}: - ${line.slice(0, 160)}`)
      }
    }
    updates.push({
      id: product.id,
      ...(descriptionChanged ? { description } : {}),
      metadata: nextMetadata,
    })
  }

  const descriptionCount = updates.filter((u) => u.description !== undefined).length
  if (dryRun) {
    logger.info(`Dry run: ${updates.length} products would change, ${descriptionCount} of them in the visible description`)
    return
  }

  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    await updateProductsWorkflow(container).run({
      input: { products: updates.slice(i, i + BATCH_SIZE) },
    })
  }

  // product.updated is ingested asynchronously; replay it so the search index
  // has the new text before this short-lived process exits.
  const search = container.resolve(Modules.SEARCH)
  for (let i = 0; i < updates.length; i += INGEST_CHUNK_SIZE) {
    await search.ingest({
      name: "product.updated",
      data: updates.slice(i, i + INGEST_CHUNK_SIZE).map((u) => ({ id: u.id })),
    } as never)
  }

  logger.info(`Cleaned ${updates.length} products (${descriptionCount} visible descriptions)`)
}
