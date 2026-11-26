import { ExecArgs, MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils"
import {
  createProductCategoriesWorkflow,
  updateProductCategoriesWorkflow,
} from "@medusajs/medusa/core-flows"

/**
 * Makes the store's category tree match CATEGORIES below. Safe to run more
 * than once.
 *
 *   npx medusa exec ./src/scripts/setup-categories.ts
 *
 * - Creates missing categories and brings name, order and parent of existing
 *   ones in line with the tree. The array order is the order in the navbar.
 * - Hides every category that is not in the tree (the demo ones).
 * - Shows a tree category only while it (or one of its subcategories) has a
 *   published product, so the navbar never links to an empty page. Run it
 *   again after adding products to a hidden category.
 *
 * Top-level handles must match CATEGORY_ICONS in the storefront's
 * src/lib/store-config.ts. Subcategory handles are what TYPE_CATEGORY in
 * import-shopify-products.ts points at.
 */
type CategoryDef = {
  name: string
  handle: string
  /**
   * Handle of the product whose thumbnail becomes the category image
   * (metadata.image_url, shown on the home page). Only fills an empty image,
   * so a picture chosen in the admin is never overwritten.
   */
  image?: string
  children?: CategoryDef[]
}

export const CATEGORIES: CategoryDef[] = [
  {
    name: "Ölçü ve Kontrol Aletleri",
    handle: "olcu-kontrol-aletleri",
    image: "ysb-1000-mm-monoblok-kumpas",
    children: [
      { name: "Kumpaslar", handle: "kumpaslar" },
      { name: "Gönyeler", handle: "gonyeler" },
      { name: "Su Terazileri", handle: "su-terazileri" },
      { name: "Lazer Ölçüm", handle: "lazer-olcum" },
      { name: "Cetvel ve Pergeller", handle: "cetvel-pergeller" },
      { name: "Komparatör ve Sayaçlar", handle: "komparator-sayaclar" },
    ],
  },
  {
    name: "Kesme ve Aşındırma",
    handle: "kesme-asindirma",
    image: "115-mm-elmas-testere",
    children: [
      { name: "Elmas Testereler", handle: "testere-bicaklari" },
      { name: "Kesme ve Taşlama Diskleri", handle: "kesme-taslama-diskleri" },
      { name: "Flap Diskler", handle: "flap-diskler" },
      { name: "Cırt Zımparalar", handle: "cirt-zimparalar" },
    ],
  },
  {
    name: "Kaynak Malzemeleri",
    handle: "kaynak-malzemeleri",
    image: "ysb-0-8-mm-er308lsi-paslanmaz-mig-kaynak-teli-15-kg",
    children: [
      { name: "Tungsten Elektrotlar", handle: "tungsten-elektrotlar" },
      { name: "TIG Kaynak Telleri", handle: "tig-kaynak-telleri" },
      { name: "MIG Kaynak Telleri", handle: "mig-kaynak-telleri" },
      { name: "Manyetik Kaynak Tutucular", handle: "manyetik-kaynak-tutucular" },
    ],
  },
  {
    name: "Elektrikli Aletler",
    handle: "elektrikli-aletler",
    image: "ysb-18v-5-ah-batarya",
    children: [
      { name: "Bits ve Lokma Uçlar", handle: "bits-lokma-uclar" },
      { name: "Batarya ve Şarj Cihazları", handle: "batarya-sarj-cihazlari" },
    ],
  },
  {
    name: "Kaldırma ve Taşıma",
    handle: "kaldirma-tasima",
    image: "ysb-0-5-ton-500-kg-6-metre-elektrikli-zincirli-caraskal",
    children: [
      { name: "Caraskallar", handle: "caraskallar" },
      { name: "Vinçler", handle: "vincler" },
      { name: "Manyetik Kaldıraçlar", handle: "manyetik-kaldiraclar" },
      { name: "Transpalet ve İstif", handle: "transpalet-istif" },
    ],
  },
  {
    name: "Paketleme ve Ambalaj",
    handle: "paketleme-ambalaj",
    image: "massimo-pozzi-xl-milano-kombine-cemberleme-makinesi-12-16-mm",
    children: [
      { name: "Çember Makineleri", handle: "cember-makineleri" },
      { name: "Ambalaj Şeritleri", handle: "ambalaj-seritleri" },
      { name: "Streç Filmler", handle: "strec-filmler" },
    ],
  },
  {
    name: "İş Güvenliği",
    handle: "is-guvenligi",
    image: "ysb-neo-20-lastik-mermerci-eldiveni",
    children: [{ name: "Eldivenler", handle: "eldivenler" }],
  },
  {
    name: "Elektrik ve Aydınlatma",
    handle: "elektrik-aydinlatma",
    image: "ysb-manyetik-ayakli-hareketli-tornaci-calisma-lambasi-110-220-v",
    children: [{ name: "Çalışma Lambaları", handle: "calisma-lambalari" }],
  },
  { name: "El Aletleri", handle: "el-aletleri" },
  { name: "Bağlantı Elemanları", handle: "baglanti-elemanlari" },
  { name: "Boya ve Yapı Kimyasalları", handle: "boya-yapi-kimyasallari" },
  { name: "Tesisat", handle: "tesisat" },
  { name: "Bahçe", handle: "bahce" },
]

type ExistingCategory = {
  id: string
  name: string
  handle: string
  rank: number
  is_active: boolean
  parent_category_id: string | null
}

const loadCategories = async (container: MedusaContainer) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product_category",
    fields: ["id", "name", "handle", "rank", "is_active", "parent_category_id"],
  })
  return data as ExistingCategory[]
}

/**
 * Shows the tree categories that have a published product (directly or in a
 * subcategory) and hides the rest. Returns how many were changed.
 */
export const syncCategoryVisibility = async (container: MedusaContainer) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle", "is_active", "products.status"],
  })
  const byHandle = new Map(data.map((c) => [c.handle, c]))
  const hasPublished = (handle: string) =>
    (byHandle.get(handle)?.products ?? []).some(
      (p) => p?.status === ProductStatus.PUBLISHED
    )

  const wantedActive = new Map<string, boolean>()
  for (const parent of CATEGORIES) {
    const children = parent.children ?? []
    children.forEach((c) => wantedActive.set(c.handle, hasPublished(c.handle)))
    wantedActive.set(
      parent.handle,
      hasPublished(parent.handle) || children.some((c) => wantedActive.get(c.handle))
    )
  }

  let changed = 0
  for (const [handle, active] of wantedActive) {
    const category = byHandle.get(handle)
    if (category && category.is_active !== active) {
      await updateProductCategoriesWorkflow(container).run({
        input: { selector: { id: category.id }, update: { is_active: active } },
      })
      changed++
    }
  }
  return changed
}

const fillCategoryImages = async (container: MedusaContainer) => {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const defs = CATEGORIES.flatMap((c) => [c, ...(c.children ?? [])]).filter(
    (c): c is CategoryDef & { image: string } => !!c.image
  )
  if (!defs.length) {
    return 0
  }

  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle", "metadata"],
    filters: { handle: defs.map((d) => d.handle) },
  })
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["handle", "thumbnail"],
    filters: { handle: defs.map((d) => d.image) },
  })
  const thumbnailByHandle = new Map(products.map((p) => [p.handle, p.thumbnail]))

  let set = 0
  for (const def of defs) {
    const category = categories.find((c) => c.handle === def.handle)
    const metadata = (category?.metadata ?? {}) as Record<string, unknown>
    if (!category || metadata.image_url) {
      continue
    }
    const thumbnail = thumbnailByHandle.get(def.image)
    if (!thumbnail) {
      logger.warn(`No thumbnail for ${def.image}, ${def.handle} keeps its icon`)
      continue
    }
    await updateProductCategoriesWorkflow(container).run({
      input: {
        selector: { id: category.id },
        update: { metadata: { ...metadata, image_url: thumbnail } },
      },
    })
    set++
  }
  return set
}

export default async function setupCategories({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  let existing = await loadCategories(container)
  const idByHandle = new Map(existing.map((c) => [c.handle, c.id]))
  const wanted = new Set(
    CATEGORIES.flatMap((c) => [c.handle, ...(c.children ?? []).map((s) => s.handle)])
  )

  // 1. Create what is missing: parents first, so children can point at them.
  const parentsToCreate = CATEGORIES.filter((c) => !idByHandle.has(c.handle))
  if (parentsToCreate.length) {
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: parentsToCreate.map((c) => ({
          name: c.name,
          handle: c.handle,
          is_active: false,
        })),
      },
    })
    result.forEach((c) => idByHandle.set(c.handle, c.id))
  }

  const childrenToCreate = CATEGORIES.flatMap((parent) =>
    (parent.children ?? [])
      .filter((c) => !idByHandle.has(c.handle))
      .map((c) => ({
        name: c.name,
        handle: c.handle,
        is_active: false,
        parent_category_id: idByHandle.get(parent.handle)!,
      }))
  )
  if (childrenToCreate.length) {
    await createProductCategoriesWorkflow(container).run({
      input: { product_categories: childrenToCreate },
    })
  }

  // 2. Name, parent and order. Setting ranks 0..n in tree order moves the
  // tree categories to the front and the rest after them.
  existing = await loadCategories(container)
  const current = new Map(existing.map((c) => [c.handle, c]))
  let updated = 0

  const align = async (def: CategoryDef, rank: number, parentId: string | null) => {
    const category = current.get(def.handle)!
    if (
      category.name === def.name &&
      category.rank === rank &&
      category.parent_category_id === parentId
    ) {
      return
    }
    await updateProductCategoriesWorkflow(container).run({
      input: {
        selector: { id: category.id },
        update: { name: def.name, rank, parent_category_id: parentId },
      },
    })
    updated++
    // A rank change shifts the siblings, so read the tree again.
    ;(await loadCategories(container)).forEach((c) => current.set(c.handle, c))
  }

  for (const [index, parent] of CATEGORIES.entries()) {
    await align(parent, index, null)
  }
  for (const parent of CATEGORIES) {
    const parentId = current.get(parent.handle)!.id
    for (const [index, child] of (parent.children ?? []).entries()) {
      await align(child, index, parentId)
    }
  }

  // 3. Hide categories that are not in the tree.
  const toHide = existing.filter((c) => !wanted.has(c.handle) && c.is_active)
  if (toHide.length) {
    await updateProductCategoriesWorkflow(container).run({
      input: {
        selector: { id: toHide.map((c) => c.id) },
        update: { is_active: false },
      },
    })
  }

  // 4. Only categories with products are visible.
  const visibilityChanges = await syncCategoryVisibility(container)

  // 5. Category images from a representative product, where none is set yet.
  const imagesSet = await fillCategoryImages(container)

  logger.info(
    `Categories: ${parentsToCreate.length + childrenToCreate.length} created, ${updated} reordered/renamed, ${toHide.length} hidden (not in tree), ${visibilityChanges} visibility changes, ${imagesSet} images set`
  )
}
