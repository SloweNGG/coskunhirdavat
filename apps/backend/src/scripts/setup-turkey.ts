import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  createRegionsWorkflow,
  createServiceZonesWorkflow,
  createShippingOptionsWorkflow,
  createTaxRegionsWorkflow,
  updateRegionsWorkflow,
  updateShippingOptionsWorkflow,
  updateStockLocationsWorkflow,
  updateStoresWorkflow,
  upsertVariantPricesWorkflow,
} from "@medusajs/medusa/core-flows"
import { DEFAULT_REGION_STORE_POLICIES } from "../lib/region-store-policies"

/**
 * Sets the store up for selling in Turkey. Safe to run more than once.
 *
 *   npx medusa exec ./src/scripts/setup-turkey.ts
 *
 * - TRY as the default store currency (prices include KDV)
 * - "Türkiye" region with PayTR as the payment provider
 * - KDV tax region (20%)
 * - Türkiye shipping zone with a "Standart Kargo" option: SHIPPING_FEE_TRY, or free
 *   when the cart item total (KDV dahil) reaches FREE_SHIPPING_THRESHOLD_TRY
 * - TRY prices on existing variants that lack one (demo data only, EUR x 40)
 */
const PAYTR_PROVIDER_ID = "pp_paytr_paytr"
// Medusa's built-in manual provider, shown to shoppers as "Havale / EFT"
const BANK_TRANSFER_PROVIDER_ID = "pp_system_default"
const REGION_PAYMENT_PROVIDERS = [PAYTR_PROVIDER_ID, BANK_TRANSFER_PROVIDER_ID]
const KDV_RATE = 20
const SHIPPING_FEE_TRY = 149.9
// Amount confirmed by the owner (2026-11-21). Keep in sync with FREE_SHIPPING_THRESHOLD in
// apps/storefront/src/lib/store-config.ts.
const FREE_SHIPPING_THRESHOLD_TRY = 3000
const DEMO_EUR_TO_TRY = 40

export default async function setupTurkey({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  // 1. Store currencies
  const {
    data: [store],
  } = await query.graph({
    entity: "store",
    fields: ["id", "supported_currencies.currency_code"],
  })

  const otherCurrencies = (store.supported_currencies ?? [])
    .map((c) => c?.currency_code)
    .filter((c): c is string => !!c && c !== "try")

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        supported_currencies: [
          { currency_code: "try", is_default: true, is_tax_inclusive: true },
          ...otherCurrencies.map((currency_code) => ({ currency_code, is_default: false })),
        ],
      },
    },
  })
  logger.info("Store currency set to TRY (KDV dahil)")

  // 2. Region
  const { data: existingRegions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "countries.iso_2"],
  })

  let region: { id: string } | undefined = existingRegions.find((r) =>
    r.countries?.some((c) => c?.iso_2 === "tr")
  )

  if (!region) {
    const { result } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "Türkiye",
            currency_code: "try",
            countries: ["tr"],
            payment_providers: REGION_PAYMENT_PROVIDERS,
            automatic_taxes: true,
            is_tax_inclusive: true,
            metadata: {
              ...DEFAULT_REGION_STORE_POLICIES,
              return_window_days: 14,
              shipping_rate: SHIPPING_FEE_TRY,
              transit_days_min: 1,
              transit_days_max: 3,
            },
          },
        ],
      },
    })
    region = { id: result[0].id }
    logger.info(`Created region Türkiye (${region.id})`)
  } else {
    await updateRegionsWorkflow(container).run({
      input: {
        selector: { id: region.id },
        update: { payment_providers: REGION_PAYMENT_PROVIDERS },
      },
    })
    logger.info(`Region for TR already exists (${region.id}), payment providers updated`)
  }

  await updateStoresWorkflow(container).run({
    input: { selector: { id: store.id }, update: { default_region_id: region.id } },
  })

  // 3. Tax region (KDV)
  const { data: taxRegions } = await query.graph({
    entity: "tax_region",
    fields: ["id", "country_code"],
    filters: { country_code: "tr" },
  })

  if (!taxRegions.length) {
    await createTaxRegionsWorkflow(container).run({
      input: [
        {
          country_code: "tr",
          provider_id: "tp_system",
          default_tax_rate: { rate: KDV_RATE, code: "KDV", name: `KDV %${KDV_RATE}` },
        },
      ],
    })
    logger.info(`Created TR tax region with KDV %${KDV_RATE}`)
  }

  // 4. Shipping: add a Türkiye service zone to the existing warehouse
  const { data: locations } = await query.graph({
    entity: "stock_location",
    fields: [
      "id",
      "name",
      "fulfillment_sets.id",
      "fulfillment_sets.service_zones.id",
      "fulfillment_sets.service_zones.name",
    ],
  })
  const location = locations[0]
  const fulfillmentSet = location?.fulfillment_sets?.[0]

  if (!location || !fulfillmentSet) {
    logger.warn("No stock location with a fulfillment set found; skipping shipping setup")
  } else {
    await updateStockLocationsWorkflow(container).run({
      input: {
        selector: { id: location.id },
        update: {
          name: "Ana Depo",
          address: { address_1: "", city: "İstanbul", country_code: "TR" },
        },
      },
    })

    let zoneId = fulfillmentSet.service_zones?.find((z) => z?.name === "Türkiye")?.id

    if (!zoneId) {
      const { result } = await createServiceZonesWorkflow(container).run({
        input: {
          data: [
            {
              name: "Türkiye",
              fulfillment_set_id: fulfillmentSet.id,
              geo_zones: [{ type: "country", country_code: "tr" }],
            },
          ],
        },
      })
      zoneId = result[0].id
      logger.info("Created Türkiye shipping zone")
    }

    // Flat fee, plus a 0 price that wins once item_total (tax-inclusive) reaches the threshold:
    // a price with more matching rules beats one with fewer, then the lowest amount wins.
    const freeRule = [
      { attribute: "item_total", operator: "gte" as const, value: FREE_SHIPPING_THRESHOLD_TRY },
    ]
    const prices = [
      { currency_code: "try", amount: SHIPPING_FEE_TRY },
      { region_id: region.id, amount: SHIPPING_FEE_TRY },
      { currency_code: "try", amount: 0, rules: freeRule },
      { region_id: region.id, amount: 0, rules: freeRule },
    ]

    const { data: existingOptions } = await query.graph({
      entity: "shipping_option",
      fields: ["id"],
      filters: { name: "Standart Kargo", service_zone_id: zoneId },
    })

    if (existingOptions[0]) {
      // Passing prices replaces the option's existing flat-rate prices.
      await updateShippingOptionsWorkflow(container).run({
        input: [{ id: existingOptions[0].id, price_type: "flat", prices }],
      })
      logger.info(
        `Updated Standart Kargo prices (free over ${FREE_SHIPPING_THRESHOLD_TRY} TRY)`
      )
    } else {
      const {
        data: [profile],
      } = await query.graph({ entity: "shipping_profile", fields: ["id"] })

      await createShippingOptionsWorkflow(container).run({
        input: [
          {
            name: "Standart Kargo",
            price_type: "flat",
            provider_id: "manual_manual",
            service_zone_id: zoneId,
            shipping_profile_id: profile.id,
            type: {
              label: "Standart",
              description: "1-3 iş gününde teslim.",
              code: "standart-tr",
            },
            prices,
            rules: [
              { attribute: "enabled_in_store", value: "true", operator: "eq" },
              { attribute: "is_return", value: "false", operator: "eq" },
            ],
          },
        ],
      })
      logger.info("Created Standart Kargo option")
    }
  }

  // 5. TRY prices for variants that have none (demo products)
  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "variants.id",
      "variants.prices.id",
      "variants.prices.currency_code",
      "variants.prices.amount",
    ],
  })

  type PriceRow = { id: string; currency_code: string; amount: number }
  const variantPrices = products.flatMap((product) =>
    (product.variants ?? [])
      .map((v) => v as unknown as { id: string; prices?: PriceRow[] })
      .filter((v) => !!v && !v.prices?.some((p) => p?.currency_code === "try"))
      .map((variant) => {
        const prices = (variant.prices ?? []).filter(Boolean)
        const eur = prices.find((p) => p.currency_code === "eur")?.amount

        return {
          variant_id: variant.id,
          product_id: product.id,
          prices: [
            ...prices.map((p) => ({
              id: p.id,
              currency_code: p.currency_code,
              amount: Number(p.amount),
            })),
            { currency_code: "try", amount: Math.round(Number(eur ?? 10) * DEMO_EUR_TO_TRY) },
          ],
        }
      })
  )

  if (variantPrices.length) {
    await upsertVariantPricesWorkflow(container).run({
      input: {
        variantPrices,
        previousVariantIds: variantPrices.map((v) => v.variant_id),
      },
    })
    logger.info(`Added TRY prices to ${variantPrices.length} variants`)
  }

  logger.info("Türkiye setup complete")
}
