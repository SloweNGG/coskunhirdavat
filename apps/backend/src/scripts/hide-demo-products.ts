import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Takes the demo products off the storefront by setting them to draft. They
 * stay in the database (old test orders point at them) and can be published
 * again from the admin. Safe to run more than once.
 *
 *   npx medusa exec ./src/scripts/hide-demo-products.ts
 *
 * Demo products are the four from Medusa's initial seed and the ones
 * seed-demo-products.ts creates (handles starting with "demo-").
 */
const SEED_HANDLES = ["t-shirt", "sweatshirt", "sweatpants", "shorts"]
const DEMO_PREFIX = "demo-"

export default async function hideDemoProducts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "status"],
  })
  const demo = products.filter(
    (p) =>
      (SEED_HANDLES.includes(p.handle) || p.handle.startsWith(DEMO_PREFIX)) &&
      p.status !== ProductStatus.DRAFT
  )

  if (!demo.length) {
    logger.info("No published demo products left.")
    return
  }

  await updateProductsWorkflow(container).run({
    input: {
      selector: { id: demo.map((p) => p.id) },
      update: { status: ProductStatus.DRAFT },
    },
  })
  logger.info(`Set ${demo.length} demo product(s) to draft: ${demo.map((p) => p.handle).join(", ")}`)
}
