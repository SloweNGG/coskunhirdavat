import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { updateCustomerGroupsWorkflow } from "@medusajs/medusa/core-flows"
import { syncGroupDiscounts } from "../../../lib/group-discounts"

/** GET /admin/group-discounts: every customer group with its discount settings. */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { data } = await req.scope.resolve("query").graph({
    entity: "customer_group",
    fields: ["id", "name", "metadata"],
  })
  res.json({
    groups: data.map((g) => ({
      id: g.id,
      name: g.name,
      enabled: g.metadata?.discount_enabled === true,
      percent: Number(g.metadata?.discount_percent) || 0,
    })),
  })
}

type Body = { groups: { id: string; enabled: boolean; percent: number }[] }

/** POST /admin/group-discounts: save settings and rebuild the automatic price lists. */
export const POST = async (req: MedusaRequest<Body>, res: MedusaResponse) => {
  const groups = req.body?.groups
  if (!Array.isArray(groups)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "groups gerekli")
  }
  for (const g of groups) {
    const percent = Number(g.percent)
    if (typeof g.id !== "string" || !(percent >= 0 && percent < 100)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "İndirim oranı 0 ile 99 arasında olmalı")
    }
  }

  const { data: current } = await req.scope.resolve("query").graph({
    entity: "customer_group",
    fields: ["id", "metadata"],
    filters: { id: groups.map((g) => g.id) },
  })
  for (const g of groups) {
    const meta = current.find((c) => c.id === g.id)?.metadata ?? {}
    await updateCustomerGroupsWorkflow(req.scope).run({
      input: {
        selector: { id: g.id },
        update: {
          metadata: { ...meta, discount_enabled: !!g.enabled, discount_percent: Number(g.percent) },
        },
      },
    })
  }

  await syncGroupDiscounts(req.scope)
  res.json({ ok: true })
}
