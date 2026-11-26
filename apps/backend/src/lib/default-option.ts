/**
 * Medusa requires every product to have at least one option. Products that
 * really have none (single-variant products, e.g. from a Shopify import) get
 * this placeholder. The storefront hides the option picker for single-variant
 * products, and the search index leaves it out of the option facets.
 */
export const DEFAULT_OPTION = { title: "Seçenek", value: "Standart" }
