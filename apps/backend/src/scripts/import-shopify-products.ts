import { readFileSync } from "node:fs"
import type { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  batchVariantImagesWorkflow,
  createInventoryLevelsWorkflow,
  createProductTagsWorkflow,
  createProductTypesWorkflow,
  createProductsWorkflow,
  updateProductsWorkflow,
} from "@medusajs/medusa/core-flows"
import { DEFAULT_OPTION } from "../lib/default-option"
import { syncCategoryVisibility } from "./setup-categories"
import {
  cleanDescription,
  cleanSeoTitle,
  htmlToText,
  parseCsv,
  type Row,
  toHandle,
} from "../lib/shopify-csv"

/**
 * Imports products from a Shopify product export (Shopify admin > Products >
 * Export > CSV for Excel or plain CSV).
 *
 *   npx medusa exec ./src/scripts/import-shopify-products.ts "/path/to/products_export.csv"
 *
 * Add `dry-run` after the path to check the file without writing anything.
 *
 * - One product per Shopify handle. Variants come from the rows that carry a
 *   price, images from the rows that carry an image, in Image Position order.
 * - Prices are TRY and include KDV, like the store's TRY currency.
 * - Stock quantities go to the first stock location. Shopify's "deny"
 *   inventory policy means no backorders.
 * - The storefront shows descriptions as plain text, so Body (HTML) is turned
 *   into text, and cleanDescription drops what belongs to the brand's own web
 *   shop (links to it, its shipping policy, its seller promises). The HTML is
 *   not kept: product metadata is public in the store API and page source.
 * - Shopify "Type" picks the category through TYPE_CATEGORY (HANDLE_CATEGORY
 *   overrides single products). Run setup-categories.ts first so those
 *   categories exist. Add `recategorize` to also move products that already
 *   exist into the category the mapping gives them. Category visibility is
 *   synced at the end, so empty categories stay out of the navbar.
 * - Cost per item is not imported, so purchase prices never reach the store.
 * - Images keep pointing at Shopify's CDN. Copy them to our own storage before
 *   the Shopify store is closed.
 * - Products whose handle already exists are skipped, so re-running is safe.
 */

/** Shopify product type -> subcategory handle (see setup-categories.ts). */
const TYPE_CATEGORY: Record<string, string> = {
  "Monoblok Kumpaslar": "kumpaslar",
  "Dijital Kumpaslar": "kumpaslar",
  "Vidalı Kumpaslar": "kumpaslar",
  "Gönyeler": "gonyeler",
  "Düz Gönyeler": "gonyeler",
  "D Gönyeler": "gonyeler",
  "Üçgen Marangoz Gönye": "gonyeler",
  "Ayarlı Gönyeler": "gonyeler",
  "Çok Fonksiyonlu Gönye": "gonyeler",
  "Su Terazisi": "su-terazileri",
  "Hassas Su Terazisi": "su-terazileri",
  "Lazer Metre": "lazer-olcum",
  "Lazer Hizalama": "lazer-olcum",
  "Çelik Cetveller": "cetvel-pergeller",
  "Pergeller": "cetvel-pergeller",
  "Komparatör Saati": "komparator-sayaclar",
  "Tur Metreler": "komparator-sayaclar",
  "Metre Sayaçları": "komparator-sayaclar",
  // The only product of this type is a kumpas + mikrometre + cetvel set.
  "Ölçü Aletleri": "kumpaslar",
  "Tungstenler": "tungsten-elektrotlar",
  "Paslanmaz TIG Kaynak Telleri": "tig-kaynak-telleri",
  "Paslanmaz MIG Kaynak Telleri": "mig-kaynak-telleri",
  "Manyetik Kaynak Tutucu": "manyetik-kaynak-tutucular",
  "Cırt Zımparalar": "cirt-zimparalar",
  "Flap Diskler": "flap-diskler",
  "Kesici Taşlar": "kesme-taslama-diskleri",
  "Taşlama Diski": "kesme-taslama-diskleri",
  "Testere Bıçakları": "testere-bicaklari",
  "Caraskallar": "caraskallar",
  "Elektrikli Zincirli Caraskal": "caraskallar",
  "Hubzuglar": "caraskallar",
  "Elektrikli Mini Vinçler": "vincler",
  "Mini Vinç Şaryo": "vincler",
  "Elektrikli Caraskal Manuel Şaryo": "caraskallar",
  "Manyetik Kaldıraç": "manyetik-kaldiraclar",
  "Transpalet": "transpalet-istif",
  "Transpalet Yedek Parça": "transpalet-istif",
  "İstifleme Makineleri": "transpalet-istif",
  "Yük Platformu | Çalışma Masası": "transpalet-istif",
  "Çember Makineleri": "cember-makineleri",
  "Akülü Çember Makineleri": "cember-makineleri",
  "Manuel Çember Makineleri": "cember-makineleri",
  "Havalı Çember Makinesi": "cember-makineleri",
  "Ambalaj Şeritleri": "ambalaj-seritleri",
  "Streç Filmler": "strec-filmler",
  "Yedek Parça ve Aksesuar": "batarya-sarj-cihazlari",
  "Bits Uç": "bits-lokma-uclar",
  "Çatı Vidaları": "bits-lokma-uclar",
  "Eldivenler": "eldivenler",
}

/** Products whose Shopify type puts them in the wrong place, by our handle. */
const HANDLE_CATEGORY: Record<string, string> = {
  "ysb-manyetik-ayakli-hareketli-tornaci-calisma-lambasi-110-220-v": "calisma-lambalari",
  "ysb-manuel-polyester-cember-germe-seti": "cember-makineleri",
}

/** Shopify types that are typos or duplicates of another type. */
const TYPE_ALIASES: Record<string, string> = {
  "streç film super power": "Streç Filmler",
}

const CURRENCY = "try"
/** Products are created in batches so one bad product doesn't roll back the rest. */
const BATCH_SIZE = 10
const LEVEL_CHUNK_SIZE = 100
const INGEST_CHUNK_SIZE = 25

type VariantRow = {
  title: string
  options: Record<string, string>
  row: Row
}

const toNumber = (value: string) => {
  const n = Number(value.replace(",", "."))
  return Number.isFinite(n) ? n : undefined
}

/** Excel exports prefix long numbers with an apostrophe to keep them as text. */
const cleanCode = (value: string) => value.replace(/^'+/, "").trim()

const chunk = <T>(items: T[], size: number): T[][] => {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

export default async function importShopifyProducts({ container, args }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  // `medusa exec` rejects unknown --flags, so the modes are plain arguments.
  const modes = new Set(["dry-run", "recategorize"])
  const dryRun = args.includes("dry-run")
  const recategorize = args.includes("recategorize")
  const file = args.find((a) => !modes.has(a))
  if (!file) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'Usage: npx medusa exec ./src/scripts/import-shopify-products.ts "/path/to/products_export.csv" [dry-run] [recategorize]'
    )
  }

  const rows = parseCsv(readFileSync(file, "utf8").replace(/^\uFEFF/, ""))
  const byHandle = new Map<string, Row[]>()
  for (const row of rows) {
    if (!row["Handle"]) {
      continue
    }
    const list = byHandle.get(row["Handle"]) ?? []
    list.push(row)
    byHandle.set(row["Handle"], list)
  }
  logger.info(`Read ${rows.length} rows, ${byHandle.size} products from ${file}`)

  // ---- Prerequisites --------------------------------------------------------

  const { data: salesChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id"],
  })
  const { data: shippingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id", "type"],
  })
  const { data: stockLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
  })
  const salesChannel = salesChannels[0]
  const shippingProfile =
    shippingProfiles.find((p) => p.type === "default") ?? shippingProfiles[0]
  const stockLocation = stockLocations[0]
  if (!salesChannel || !shippingProfile || !stockLocation) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "A sales channel, a shipping profile and a stock location are required. Run db:migrate first."
    )
  }

  const { data: categories } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle", "parent_category_id"],
  })
  const categoryByHandle = new Map(categories.map((c) => [c.handle, c]))
  const missingCategories = [
    ...new Set([...Object.values(TYPE_CATEGORY), ...Object.values(HANDLE_CATEGORY)]),
  ].filter((handle) => !categoryByHandle.has(handle))
  if (missingCategories.length && dryRun) {
    logger.warn(`Missing categories (run setup-categories.ts): ${missingCategories.join(", ")}`)
  } else if (missingCategories.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Missing categories ${missingCategories.join(", ")}. Run setup-categories.ts first.`
    )
  }

  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "categories.id", "variants.sku", "variants.barcode"],
  })
  const existingByHandle = new Map(existingProducts.map((p) => [p.handle, p]))
  const usedSkus = new Set<string>()
  const usedBarcodes = new Set<string>()
  for (const product of existingProducts) {
    for (const variant of product.variants ?? []) {
      if (variant?.sku) {
        usedSkus.add(variant.sku)
      }
      if (variant?.barcode) {
        usedBarcodes.add(variant.barcode)
      }
    }
  }

  // ---- Product types and tags -------------------------------------------------

  const typeOf = (row: Row) => {
    const raw = row["Type"].trim()
    return TYPE_ALIASES[raw] ?? raw
  }
  const tagsOf = (row: Row) => {
    const seen = new Set<string>()
    return row["Tags"]
      .split(",")
      .map((t) => t.trim())
      .filter((t) => {
        const key = t.toLocaleLowerCase("tr")
        if (!t || seen.has(key)) {
          return false
        }
        seen.add(key)
        return true
      })
  }

  const firstRows = [...byHandle.values()].map((list) => list[0])

  const { data: existingTypes } = await query.graph({
    entity: "product_type",
    fields: ["id", "value"],
  })
  const typeIds = new Map(existingTypes.map((t) => [t.value, t.id as string]))
  const newTypes = [...new Set(firstRows.map(typeOf).filter(Boolean))].filter(
    (value) => !typeIds.has(value)
  )
  if (newTypes.length && !dryRun) {
    const { result } = await createProductTypesWorkflow(container).run({
      input: { product_types: newTypes.map((value) => ({ value })) },
    })
    result.forEach((t) => typeIds.set(t.value, t.id))
  }

  // Tag values are matched without regard to case, so "YSB Gönye" and
  // "ysb gönye" become one tag.
  const { data: existingTags } = await query.graph({
    entity: "product_tag",
    fields: ["id", "value"],
  })
  const tagIds = new Map(
    existingTags.map((t) => [t.value.toLocaleLowerCase("tr"), t.id as string])
  )
  const newTags = new Map<string, string>()
  for (const tag of firstRows.flatMap(tagsOf)) {
    const key = tag.toLocaleLowerCase("tr")
    if (!tagIds.has(key) && !newTags.has(key)) {
      newTags.set(key, tag)
    }
  }
  for (const values of chunk(dryRun ? [] : [...newTags.values()], 200)) {
    const { result } = await createProductTagsWorkflow(container).run({
      input: { product_tags: values.map((value) => ({ value })) },
    })
    result.forEach((t) => tagIds.set(t.value.toLocaleLowerCase("tr"), t.id))
  }

  // ---- Build products -------------------------------------------------------

  const report = {
    skippedExisting: [] as string[],
    unmappedTypes: new Set<string>(),
    clearedSkus: [] as string[],
    clearedBarcodes: [] as string[],
    failed: [] as { handle: string; error: string }[],
  }
  /** handle -> variant title -> stock / variant image, for after creation. */
  const stockByHandle = new Map<string, Map<string, number>>()
  const variantImageByHandle = new Map<string, Map<string, string>>()
  const products: Record<string, unknown>[] = []
  const recategorized: { id: string; category_ids: string[] }[] = []

  /** The subcategory and its parent, so the product shows on both pages. */
  const categoryIdsFor = (handle: string, type: string) => {
    const categoryHandle = HANDLE_CATEGORY[handle] ?? TYPE_CATEGORY[type]
    const category = categoryHandle ? categoryByHandle.get(categoryHandle) : undefined
    if (!category) {
      report.unmappedTypes.add(type || "(boş)")
      return []
    }
    return [category.id, category.parent_category_id].filter((id): id is string => !!id)
  }

  for (const [shopifyHandle, list] of byHandle) {
    const first = list[0]
    const handle = toHandle(shopifyHandle)
    const type = typeOf(first)
    const categoryIds = categoryIdsFor(handle, type)

    const existing = existingByHandle.get(handle)
    if (existing) {
      report.skippedExisting.push(handle)
      const current = (existing.categories ?? []).map((c) => c?.id).sort().join()
      if (recategorize && categoryIds.length && current !== [...categoryIds].sort().join()) {
        recategorized.push({ id: existing.id, category_ids: categoryIds })
      }
      continue
    }

    // Option names live on the product's first row only.
    const optionNames = [1, 2, 3]
      .map((n) => first[`Option${n} Name`].trim())
      .filter(Boolean)

    const variantRows: VariantRow[] = list
      .filter((row) => row["Variant Price"])
      .map((row) => {
        const options: Record<string, string> = {}
        optionNames.forEach((name, i) => {
          options[name] = row[`Option${i + 1} Value`].trim()
        })
        return { title: "", options, row }
      })

    // Shopify marks products without options with "Title: Default Title".
    // Medusa requires at least one option, so they get "Seçenek: Standart"
    // (the storefront hides the option picker for single-variant products).
    const isDefault =
      variantRows.length === 1 &&
      (optionNames.length === 0 ||
        (optionNames.length === 1 &&
          optionNames[0] === "Title" &&
          variantRows[0].options["Title"] === "Default Title"))
    if (isDefault) {
      optionNames.splice(0, optionNames.length, DEFAULT_OPTION.title)
      variantRows[0].options = { [DEFAULT_OPTION.title]: DEFAULT_OPTION.value }
    }
    for (const variant of variantRows) {
      variant.title = Object.values(variant.options).join(" / ") || first["Title"]
    }

    const images = list
      .filter((row) => row["Image Src"])
      .sort((a, b) => (toNumber(a["Image Position"]) ?? 0) - (toNumber(b["Image Position"]) ?? 0))
      .map((row) => row["Image Src"])
      .filter((url, i, all) => all.indexOf(url) === i)

    const stock = new Map<string, number>()
    const variantImages = new Map<string, string>()

    const variants = variantRows.map(({ title, options, row }) => {
      const metadata: Record<string, unknown> = {}

      let sku: string | undefined = cleanCode(row["Variant SKU"]) || undefined
      if (sku && usedSkus.has(sku)) {
        report.clearedSkus.push(`${sku} (${handle} / ${title})`)
        metadata.shopify_sku = sku
        sku = undefined
      }
      if (sku) {
        usedSkus.add(sku)
      }

      let barcode: string | undefined =
        cleanCode(row["Variant Barcodes"].split(",")[0] ?? "") || undefined
      if (barcode && usedBarcodes.has(barcode)) {
        report.clearedBarcodes.push(`${barcode} (${handle} / ${title})`)
        metadata.shopify_barcode = barcode
        barcode = undefined
      }
      if (barcode) {
        usedBarcodes.add(barcode)
      }

      stock.set(title, Math.max(0, Math.trunc(toNumber(row["Variant Inventory Qty"]) ?? 0)))
      if (row["Variant Image"]) {
        variantImages.set(title, row["Variant Image"])
        if (!images.includes(row["Variant Image"])) {
          images.push(row["Variant Image"])
        }
      }

      return {
        title,
        sku,
        barcode,
        // Shopify's "Variant Grams" is always grams, whatever the display unit.
        weight: toNumber(row["Variant Grams"]) || undefined,
        manage_inventory: true,
        allow_backorder: row["Variant Inventory Policy"] === "continue",
        options,
        prices: [{ amount: toNumber(row["Variant Price"]) ?? 0, currency_code: CURRENCY }],
        metadata: Object.keys(metadata).length ? metadata : undefined,
      }
    })

    stockByHandle.set(handle, stock)
    variantImageByHandle.set(handle, variantImages)

    const optionValues = optionNames.map((name) => ({
      title: name,
      values: [...new Set(variantRows.map((v) => v.options[name]))],
    }))

    const body = first["Body (HTML)"]
    const metadata: Record<string, unknown> = {
      source: "shopify",
      brand: first["Vendor"] || undefined,
      seo_title: cleanSeoTitle(first["SEO Title"]) || undefined,
      seo_description: cleanDescription(first["SEO Description"]) || undefined,
    }
    if (handle !== shopifyHandle) {
      metadata.shopify_handle = shopifyHandle
    }

    products.push({
      title: first["Title"],
      handle,
      description: body ? cleanDescription(htmlToText(body)) : undefined,
      status:
        first["Status"] === "active" ? ProductStatus.PUBLISHED : ProductStatus.DRAFT,
      thumbnail: images[0],
      images: images.map((url) => ({ url })),
      weight: variants[0]?.weight,
      type_id: typeIds.get(type),
      tag_ids: tagsOf(first)
        .map((t) => tagIds.get(t.toLocaleLowerCase("tr")))
        .filter((id): id is string => !!id),
      category_ids: categoryIds,
      sales_channels: [{ id: salesChannel.id }],
      shipping_profile_id: shippingProfile.id,
      options: optionValues,
      variants,
      metadata: JSON.parse(JSON.stringify(metadata)),
    })
  }

  if (dryRun) {
    const variantCount = products.reduce(
      (sum, p) => sum + (p.variants as unknown[]).length,
      0
    )
    const sample = { ...products[0], metadata: undefined }
    logger.info(`Dry run: would create ${products.length} products, ${variantCount} variants, ${newTypes.length} types, ${newTags.size} tags`)
    logger.info(`Skipped (already exist): ${report.skippedExisting.length}, would move to another category: ${recategorized.length}`)
    logger.info(`Unmapped types: ${[...report.unmappedTypes].join(", ") || "none"}`)
    logger.info(`Duplicate SKUs to clear: ${report.clearedSkus.length}, barcodes: ${report.clearedBarcodes.length}`)
    logger.info(`Sample product:\n${JSON.stringify(sample, null, 2)}`)
    return
  }

  // ---- Create ---------------------------------------------------------------

  const createdHandles: string[] = []
  const create = async (batch: Record<string, unknown>[]) => {
    await createProductsWorkflow(container).run({
      input: { products: batch as never },
    })
    createdHandles.push(...batch.map((p) => p.handle as string))
  }

  for (const batch of chunk(products, BATCH_SIZE)) {
    try {
      await create(batch)
    } catch {
      // Retry one by one to find the product that broke the batch.
      for (const product of batch) {
        try {
          await create([product])
        } catch (e) {
          // Workflow errors are plain objects, not Error instances.
          const message =
            e && typeof e === "object" && "message" in e
              ? String((e as { message: unknown }).message)
              : JSON.stringify(e)
          report.failed.push({ handle: product.handle as string, error: message })
        }
      }
    }
    logger.info(`Created ${createdHandles.length}/${products.length} products`)
  }

  for (const part of chunk(recategorized, BATCH_SIZE)) {
    await updateProductsWorkflow(container).run({ input: { products: part } })
  }
  if (recategorized.length) {
    logger.info(`Moved ${recategorized.length} existing products to their mapped category`)
  }

  // ---- Stock and variant images -----------------------------------------------

  const created = createdHandles.length
    ? (
        await query.graph({
          entity: "product",
          fields: [
            "id",
            "handle",
            "images.id",
            "images.url",
            "variants.id",
            "variants.title",
            "variants.inventory_items.inventory_item_id",
          ],
          filters: { handle: createdHandles },
        })
      ).data
    : []

  const levels: { inventory_item_id: string; location_id: string; stocked_quantity: number }[] = []
  const variantImageLinks: { variant_id: string; image_id: string }[] = []

  for (const product of created) {
    const stock = stockByHandle.get(product.handle) ?? new Map()
    const variantImages = variantImageByHandle.get(product.handle) ?? new Map()

    for (const variant of product.variants ?? []) {
      if (!variant) {
        continue
      }
      const inventoryItemId = variant.inventory_items?.[0]?.inventory_item_id
      if (inventoryItemId) {
        levels.push({
          inventory_item_id: inventoryItemId,
          location_id: stockLocation.id,
          stocked_quantity: stock.get(variant.title) ?? 0,
        })
      }
      const imageUrl = variantImages.get(variant.title)
      const image = imageUrl && product.images?.find((i) => i?.url === imageUrl)
      if (image) {
        variantImageLinks.push({ variant_id: variant.id, image_id: image.id })
      }
    }
  }

  for (const part of chunk(levels, LEVEL_CHUNK_SIZE)) {
    await createInventoryLevelsWorkflow(container).run({
      input: { inventory_levels: part },
    })
  }
  logger.info(`Stock set for ${levels.length} variants at ${stockLocation.name}`)

  for (const link of variantImageLinks) {
    await batchVariantImagesWorkflow(container).run({
      input: { variant_id: link.variant_id, add: [link.image_id] },
    })
  }
  logger.info(`Linked ${variantImageLinks.length} variant images`)

  // ---- Search index ---------------------------------------------------------

  // product.created is handled asynchronously on the local event bus, so a
  // short-lived exec process can exit before it is ingested. Replaying it here
  // is awaited and upserts, so it is safe to repeat.
  const search = container.resolve(Modules.SEARCH)
  const ingest = async (name: string, ids: string[]) => {
    for (const part of chunk(ids, INGEST_CHUNK_SIZE)) {
      await search.ingest({ name, data: part.map((id) => ({ id })) } as never)
    }
  }
  await ingest("product.created", created.map((p) => p.id as string))
  await ingest("product.updated", recategorized.map((p) => p.id))

  // Categories that just got their first product appear in the navbar, and
  // ones that lost their last product disappear from it.
  const visibilityChanges = await syncCategoryVisibility(container)
  logger.info(`Category visibility changes: ${visibilityChanges}`)

  // ---- Report ---------------------------------------------------------------

  const outOfStock = levels.filter((l) => l.stocked_quantity === 0).length
  logger.info(`Done: ${createdHandles.length} created, ${report.skippedExisting.length} skipped (already exist), ${report.failed.length} failed`)
  logger.info(`Variants with zero stock: ${outOfStock}/${levels.length}`)
  if (report.unmappedTypes.size) {
    logger.warn(`No category for types: ${[...report.unmappedTypes].join(", ")}`)
  }
  if (report.clearedSkus.length) {
    logger.warn(`Duplicate SKUs left empty (original in metadata.shopify_sku):\n  ${report.clearedSkus.join("\n  ")}`)
  }
  if (report.clearedBarcodes.length) {
    logger.warn(`Duplicate barcodes left empty (original in metadata.shopify_barcode):\n  ${report.clearedBarcodes.join("\n  ")}`)
  }
  for (const failure of report.failed) {
    logger.error(`Failed ${failure.handle}: ${failure.error}`)
  }
}
