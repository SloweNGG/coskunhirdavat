import { MedusaContainer } from "@medusajs/framework/types"
import { syncGroupDiscounts } from "../lib/group-discounts"

/** Keeps automatic group prices in step with new products and price changes. */
export default async function syncGroupDiscountsJob(container: MedusaContainer) {
  await syncGroupDiscounts(container)
}

export const config = {
  name: "sync-group-discounts",
  schedule: "0 * * * *",
}
