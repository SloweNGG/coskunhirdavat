import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  createPriceListsWorkflow,
  deletePriceListsWorkflow,
} from "@medusajs/medusa/core-flows"

/**
 * Automatic group discount: settings live on the customer group's metadata
 * (`discount_enabled`, `discount_percent`). Each enabled group gets one generated
 * sale price list "Otomatik indirim – <group>" = base TRY price minus the percentage.
 * Manual price lists stay untouched; Medusa shows the customer the lowest price.
 */
export const AUTO_LIST_PREFIX = "Otomatik indirim – "

export const discountedAmount = (base: number, percent: number) =>
  Math.round(base * (1 - percent / 100) * 100) / 100

export async function syncGroupDiscounts(container: MedusaContainer) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: groups } = await query.graph({
    entity: "customer_group",
    fields: ["id", "name", "metadata"],
  })
  const { data: lists } = await query.graph({
    entity: "price_list",
    fields: ["id", "title"],
  })

  // Rebuild from scratch: simpler than diffing, and price lists are cheap.
  const old = lists.filter((l) => l.title?.startsWith(AUTO_LIST_PREFIX)).map((l) => l.id)
  if (old.length) {
    await deletePriceListsWorkflow(container).run({ input: { ids: old } })
  }

  const active = groups.filter((g) => {
    const p = Number(g.metadata?.discount_percent)
    return g.metadata?.discount_enabled === true && p > 0 && p < 100
  })
  if (!active.length) {
    return
  }

  // shortcut: loads every variant at once; paginate past ~10k variants.
  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: ["id", "prices.amount", "prices.currency_code", "prices.price_list_id", "prices.rules_count"],
  })
  const base = variants.flatMap((v) => {
    // `prices` comes from the variant↔price-set link, which the generated types omit.
    const prices = (v as unknown as { prices?: { amount: number; currency_code: string; price_list_id?: string | null; rules_count?: number }[] }).prices
    const p = (prices ?? []).find(
      (p) => p?.currency_code === "try" && !p.price_list_id && !p.rules_count
    )
    return p ? [{ variant_id: v.id, amount: Number(p.amount) }] : []
  })

  await createPriceListsWorkflow(container).run({
    input: {
      price_lists_data: active.map((g) => {
        const percent = Number(g.metadata!.discount_percent)
        return {
          title: `${AUTO_LIST_PREFIX}${g.name}`,
          description: `${g.name} grubuna otomatik %${percent} indirim (Ayarlar › Grup indirimleri).`,
          type: "sale",
          status: "active",
          rules: { "customer.groups.id": [g.id] },
          prices: base.map((b) => ({
            variant_id: b.variant_id,
            currency_code: "try",
            amount: discountedAmount(b.amount, percent),
          })),
        }
      }) as any,
    },
  })
}
