import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import {
  addShippingMethodToCartWorkflow,
  capturePaymentWorkflow,
  completeCartWorkflow,
  createCartWorkflow,
  createPaymentCollectionForCartWorkflow,
  createPaymentSessionsWorkflow,
  deleteCustomersWorkflow,
} from "@medusajs/medusa/core-flows"

/**
 * LOCAL DEVELOPMENT ONLY. Places sample Havale / EFT orders spread over the
 * last 60 days so the admin "Özet" page has something to draw. Orders older
 * than five days are marked as paid; newer ones wait for the transfer.
 * Every order carries metadata.demo_seed = true.
 *
 *   npx medusa exec ./src/scripts/demo-orders.ts          # add 45 orders
 *   npx medusa exec ./src/scripts/demo-orders.ts sil      # remove them and their guest customers
 *
 * Never run this against the production database.
 */
const ORDER_COUNT = 45
const SPAN_DAYS = 60
const DAY_MS = 24 * 60 * 60 * 1000

const NAMES = [
  ["Ahmet", "Yılmaz"],
  ["Mehmet", "Kaya"],
  ["Ayşe", "Demir"],
  ["Fatma", "Şahin"],
  ["Mustafa", "Çelik"],
  ["Emine", "Yıldız"],
  ["Ali", "Öztürk"],
  ["Hatice", "Aydın"],
  ["Hüseyin", "Arslan"],
  ["Zeynep", "Doğan"],
]
const CITIES = [
  ["İstanbul", "Kadıköy"],
  ["Ankara", "Çankaya"],
  ["İzmir", "Bornova"],
  ["Bursa", "Nilüfer"],
  ["Antalya", "Muratpaşa"],
]

// Small deterministic PRNG so every run produces the same shape.
const rng = (() => {
  let seed = 20261126
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
})()
const pick = <T,>(list: T[]) => list[Math.floor(rng() * list.length)]

export default async function demoOrders({ container, args }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  if (args?.includes("sil")) {
    await removeDemoOrders(container)
    return
  }

  const {
    data: [region],
  } = await query.graph({
    entity: "region",
    fields: ["id"],
    filters: { currency_code: "try" },
  })
  const {
    data: [channel],
  } = await query.graph({ entity: "sales_channel", fields: ["id"] })
  const { data: options } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name"],
  })
  const shipping = options.find((o) => o.name === "Standart Kargo") ?? options[0]
  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: ["id"],
  })

  if (!region || !channel || !shipping || !variants.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Run setup-turkey.ts first: Türkiye region, shipping or products missing."
    )
  }

  const now = Date.now()
  let created = 0
  for (let i = 0; i < ORDER_COUNT; i++) {
    // Skew towards recent days so the chart shows growth.
    const ageDays = Math.floor(Math.pow(rng(), 1.4) * SPAN_DAYS)
    const createdAt = new Date(now - ageDays * DAY_MS - Math.floor(rng() * 10) * 60 * 60 * 1000)
    const [first_name, last_name] = pick(NAMES)
    const [province, city] = pick(CITIES)
    const address = {
      first_name,
      last_name,
      address_1: `${pick(["Atatürk", "Cumhuriyet", "İnönü", "Gazi"])} Cad. No: ${1 + Math.floor(rng() * 90)}`,
      city,
      province,
      country_code: "tr",
      phone: "+905550000000",
    }
    const itemCount = 1 + Math.floor(rng() * 3)

    const { result: cart } = await createCartWorkflow(container).run({
      input: {
        region_id: region.id,
        sales_channel_id: channel.id,
        currency_code: "try",
        email: `demo-${i + 1}@example.test`,
        shipping_address: address,
        billing_address: address,
        items: Array.from({ length: itemCount }, () => ({
          variant_id: pick(variants).id,
          quantity: 1 + Math.floor(Math.pow(rng(), 2) * 4),
        })),
        metadata: { demo_seed: true, invoice: { type: "individual" } },
      },
    })
    await addShippingMethodToCartWorkflow(container).run({
      input: { cart_id: cart.id, options: [{ id: shipping.id }] },
    })
    const { result: collection } = await createPaymentCollectionForCartWorkflow(
      container
    ).run({ input: { cart_id: cart.id } })
    await createPaymentSessionsWorkflow(container).run({
      input: { payment_collection_id: collection.id, provider_id: "pp_system_default" },
    })
    const { result: order } = await completeCartWorkflow(container).run({
      input: { id: cart.id },
    })

    if (ageDays > 5) {
      const {
        data: [placed],
      } = await query.graph({
        entity: "order",
        fields: ["payment_collections.payments.id"],
        filters: { id: order.id },
      })
      const paymentId = placed?.payment_collections?.[0]?.payments?.[0]?.id
      if (paymentId) {
        await capturePaymentWorkflow(container).run({ input: { payment_id: paymentId } })
      }
    }

    // Workflows always stamp "now"; move the demo order back to its day.
    const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)
    await knex("order").where({ id: order.id }).update({ created_at: createdAt })
    created++
  }

  logger.info(`Added ${created} demo orders (metadata.demo_seed = true).`)
}

async function removeDemoOrders(container: ExecArgs["container"]) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const orderModule = container.resolve(Modules.ORDER)
  const inventoryModule = container.resolve(Modules.INVENTORY)

  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "metadata", "items.id"],
  })
  const demo = orders.filter((o) => o.metadata?.demo_seed === true)
  if (!demo.length) {
    logger.info("No demo orders found.")
    return
  }

  const lineItemIds = demo.flatMap((o) => (o.items ?? []).map((i) => i!.id))
  if (lineItemIds.length) {
    await inventoryModule.deleteReservationItemsByLineItem(lineItemIds)
  }
  await orderModule.softDeleteOrders(demo.map((o) => o.id))
  logger.info(`Removed ${demo.length} demo orders.`)

  // Guest checkouts created a customer record per demo e-mail address.
  const { data: customers } = await query.graph({
    entity: "customer",
    fields: ["id", "email", "has_account"],
  })
  const demoCustomers = customers.filter(
    (c) => !c.has_account && /^demo-\d+@example\.test$/.test(c.email ?? "")
  )
  if (demoCustomers.length) {
    await deleteCustomersWorkflow(container).run({
      input: { ids: demoCustomers.map((c) => c.id) },
    })
    logger.info(`Removed ${demoCustomers.length} demo guest customers.`)
  }
}
