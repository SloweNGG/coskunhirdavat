import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

/**
 * Rebuilds every product's search document. Run it after changing how
 * products are indexed (src/search/) or after editing products with raw SQL,
 * which emits no product events. Safe to repeat: ingestion upserts.
 *
 *   npx medusa exec ./src/scripts/reindex-search.ts
 */
const INGEST_CHUNK_SIZE = 25

export default async function reindexSearch({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const search = container.resolve(Modules.SEARCH)

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id"],
  })

  for (let start = 0; start < products.length; start += INGEST_CHUNK_SIZE) {
    const chunk = products.slice(start, start + INGEST_CHUNK_SIZE)
    await search.ingest({
      name: "product.updated",
      data: chunk.map((product) => ({ id: product.id })),
    } as never)
  }

  logger.info(`Search index rebuilt for ${products.length} product(s)`)
}
