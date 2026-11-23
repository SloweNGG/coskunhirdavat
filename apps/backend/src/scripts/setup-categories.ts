import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  createProductCategoriesWorkflow,
  updateProductCategoriesWorkflow,
} from "@medusajs/medusa/core-flows"

/**
 * Creates the hardware store's top-level categories and hides every other
 * category (the demo ones). Safe to run more than once.
 *
 *   npx medusa exec ./src/scripts/setup-categories.ts
 *
 * Handles must match CATEGORY_ICONS in the storefront's src/lib/store-config.ts.
 */
const CATEGORIES = [
  { name: "El Aletleri", handle: "el-aletleri" },
  { name: "Elektrikli Aletler", handle: "elektrikli-aletler" },
  { name: "Bağlantı Elemanları", handle: "baglanti-elemanlari" },
  { name: "İş Güvenliği", handle: "is-guvenligi" },
  { name: "Boya ve Yapı Kimyasalları", handle: "boya-yapi-kimyasallari" },
  { name: "Elektrik ve Aydınlatma", handle: "elektrik-aydinlatma" },
  { name: "Tesisat", handle: "tesisat" },
  { name: "Bahçe", handle: "bahce" },
]

export default async function setupCategories({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: existing } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle", "is_active"],
  })
  const existingHandles = new Set(existing.map((c) => c.handle))
  const wanted = new Set(CATEGORIES.map((c) => c.handle))

  const toCreate = CATEGORIES.filter((c) => !existingHandles.has(c.handle)).map(
    (c) => ({
      name: c.name,
      handle: c.handle,
      is_active: true,
      rank: CATEGORIES.indexOf(c),
    })
  )
  if (toCreate.length) {
    await createProductCategoriesWorkflow(container).run({
      input: { product_categories: toCreate },
    })
  }

  const toHide = existing.filter((c) => !wanted.has(c.handle) && c.is_active)
  if (toHide.length) {
    await updateProductCategoriesWorkflow(container).run({
      input: {
        selector: { id: toHide.map((c) => c.id) },
        update: { is_active: false },
      },
    })
  }

  logger.info(
    `Categories: ${toCreate.length} created, ${toHide.length} hidden`
  )
}
