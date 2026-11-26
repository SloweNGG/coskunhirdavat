"use client"
import { Radio, RadioGroup } from "@headlessui/react"
import { setShippingMethod } from "@lib/data/cart"
import { calculatePriceForShippingOption } from "@lib/data/fulfillment"
import { convertToLocale } from "@lib/util/money"
import { Loader } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import ErrorMessage from "@modules/checkout/components/error-message"
import MedusaRadio from "@modules/common/components/radio"
import { Button } from "@modules/common/components/ui"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import PriceText from "@modules/common/components/price-text"
import StepCard, { StepInfo } from "@modules/checkout/components/step-card"
import {
  CHECKOUT_CTA,
  optionClass,
} from "@modules/checkout/components/cta-class"

const PICKUP_OPTION_ON = "__PICKUP_ON"
const PICKUP_OPTION_OFF = "__PICKUP_OFF"

/** Shipping price in the price font; 0 reads "Ücretsiz", like the free shipping bar. */
const ShippingPrice = ({
  amount,
  currencyCode,
}: {
  amount?: number | null
  currencyCode: string
}) => {
  if (amount === null || amount === undefined) {
    return <span>-</span>
  }
  if (amount === 0) {
    return <span className="font-semibold text-emerald-700">Ücretsiz</span>
  }
  return (
    <PriceText
      value={convertToLocale({ amount, currency_code: currencyCode })}
    />
  )
}

type ShippingProps = {
  cart: HttpTypes.StoreCart
  availableShippingMethods: HttpTypes.StoreCartShippingOption[] | null
}

function formatAddress(address: HttpTypes.StoreCartAddress) {
  if (!address) {
    return ""
  }

  let ret = ""

  if (address.address_1) {
    ret += ` ${address.address_1}`
  }

  if (address.address_2) {
    ret += `, ${address.address_2}`
  }

  if (address.postal_code) {
    ret += `, ${address.postal_code} ${address.city}`
  }

  if (address.country_code) {
    ret += `, ${address.country_code.toUpperCase()}`
  }

  return ret
}

const Shipping: React.FC<ShippingProps> = ({
  cart,
  availableShippingMethods,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPrices, setIsLoadingPrices] = useState(true)

  const [showPickupOptions, setShowPickupOptions] =
    useState<string>(PICKUP_OPTION_OFF)
  const [calculatedPricesMap, setCalculatedPricesMap] = useState<
    Record<string, number>
  >({})
  const [error, setError] = useState<string | null>(null)
  const [shippingMethodId, setShippingMethodId] = useState<string | null>(
    cart.shipping_methods?.at(-1)?.shipping_option_id || null
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "delivery"

  const _shippingMethods = availableShippingMethods?.filter(
    (sm) =>
      (
        sm as unknown as {
          service_zone?: {
            fulfillment_set?: {
              type?: string
              location?: { address: HttpTypes.StoreCartAddress }
            }
          }
        }
      ).service_zone?.fulfillment_set?.type !== "pickup"
  )

  const _pickupMethods = availableShippingMethods?.filter(
    (sm) =>
      (
        sm as unknown as {
          service_zone?: {
            fulfillment_set?: {
              type?: string
              location?: { address: HttpTypes.StoreCartAddress }
            }
          }
        }
      ).service_zone?.fulfillment_set?.type === "pickup"
  )

  const hasPickupOptions = !!_pickupMethods?.length

  useEffect(() => {
    setIsLoadingPrices(true)

    if (_shippingMethods?.length) {
      const promises = _shippingMethods
        .filter((sm) => sm.price_type === "calculated")
        .map((sm) => calculatePriceForShippingOption(sm.id, cart.id))

      if (promises.length) {
        Promise.allSettled(promises).then((res) => {
          const pricesMap: Record<string, number> = {}
          res
            .filter((r) => r.status === "fulfilled")
            .forEach((p) => {
              if (p.value?.id) {
                pricesMap[p.value.id] = p.value.amount ?? 0
              }
            })

          setCalculatedPricesMap(pricesMap)
          setIsLoadingPrices(false)
        })
      }
    }

    if (_pickupMethods?.find((m) => m.id === shippingMethodId)) {
      setShowPickupOptions(PICKUP_OPTION_ON)
    }
  }, [availableShippingMethods])

  const handleEdit = () => {
    router.push(pathname + "?step=delivery", { scroll: false })
  }

  const handleSubmit = () => {
    router.push(pathname + "?step=payment", { scroll: false })
  }

  const handleSetShippingMethod = async (
    id: string,
    variant: "shipping" | "pickup"
  ) => {
    setError(null)

    if (variant === "pickup") {
      setShowPickupOptions(PICKUP_OPTION_ON)
    } else {
      setShowPickupOptions(PICKUP_OPTION_OFF)
    }

    let currentId: string | null = null
    setIsLoading(true)
    setShippingMethodId((prev) => {
      currentId = prev
      return id
    })

    await setShippingMethod({ cartId: cart.id, shippingMethodId: id })
      .catch((err) => {
        setShippingMethodId(currentId)

        setError(err.message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  const lastMethod = cart.shipping_methods?.at(-1)
  const deliveryDone = (cart.shipping_methods?.length ?? 0) > 0

  return (
    <StepCard
      step={2}
      title="Teslimat"
      state={isOpen ? "active" : deliveryDone ? "done" : "upcoming"}
      onEdit={
        !isOpen &&
        cart?.shipping_address &&
        cart?.billing_address &&
        cart?.email
          ? handleEdit
          : undefined
      }
      editTestId="edit-delivery-button"
    >
      {isOpen ? (
        <>
          <div className="mb-4 flex flex-col">
            <span className="text-sm font-semibold text-navy">
              Kargo yöntemi
            </span>
            <span className="text-sm text-muted">
              Siparişinizin nasıl teslim edilmesini istersiniz?
            </span>
          </div>
          <div data-testid="delivery-options-container">
            {hasPickupOptions && (
              <RadioGroup
                value={showPickupOptions}
                onChange={(_value) => {
                  const id = _pickupMethods.find(
                    (option) => !option.insufficient_inventory
                  )?.id

                  if (id) {
                    handleSetShippingMethod(id, "pickup")
                  }
                }}
              >
                <Radio
                  value={PICKUP_OPTION_ON}
                  data-testid="delivery-option-radio"
                  className={optionClass(
                    showPickupOptions === PICKUP_OPTION_ON
                  )}
                >
                  <div className="flex items-center gap-x-3">
                    <MedusaRadio
                      checked={showPickupOptions === PICKUP_OPTION_ON}
                    />
                    <span className="text-[15px] font-semibold text-navy">
                      Mağazadan teslim al
                    </span>
                  </div>
                  <span className="text-navy/50">-</span>
                </Radio>
              </RadioGroup>
            )}
            <RadioGroup
              value={shippingMethodId}
              onChange={(v) => {
                if (v) {
                  return handleSetShippingMethod(v, "shipping")
                }
              }}
            >
              {_shippingMethods?.map((option) => {
                const isDisabled =
                  option.price_type === "calculated" &&
                  !isLoadingPrices &&
                  typeof calculatedPricesMap[option.id] !== "number"

                return (
                  <Radio
                    key={option.id}
                    value={option.id}
                    data-testid="delivery-option-radio"
                    disabled={isDisabled}
                    className={optionClass(
                      option.id === shippingMethodId,
                      isDisabled
                    )}
                  >
                    <div className="flex items-center gap-x-3">
                      <MedusaRadio checked={option.id === shippingMethodId} />
                      <span className="text-[15px] font-semibold text-navy">
                        {option.name}
                      </span>
                    </div>
                    <span className="text-[15px] font-semibold text-navy">
                      {option.price_type === "flat" ? (
                        <ShippingPrice
                          amount={option.amount}
                          currencyCode={cart.currency_code}
                        />
                      ) : calculatedPricesMap[option.id] ? (
                        <ShippingPrice
                          amount={calculatedPricesMap[option.id]}
                          currencyCode={cart.currency_code}
                        />
                      ) : isLoadingPrices ? (
                        <Loader />
                      ) : (
                        "-"
                      )}
                    </span>
                  </Radio>
                )
              })}
            </RadioGroup>
          </div>

          {showPickupOptions === PICKUP_OPTION_ON && (
            <div className="mt-6">
              <div className="mb-4 flex flex-col">
                <span className="text-sm font-semibold text-navy">Mağaza</span>
                <span className="text-sm text-muted">
                  Size yakın bir mağaza seçin
                </span>
              </div>
              <div data-testid="delivery-options-container">
                <RadioGroup
                  value={shippingMethodId}
                  onChange={(v) => {
                    if (v) {
                      return handleSetShippingMethod(v, "pickup")
                    }
                  }}
                >
                  {_pickupMethods?.map((option) => {
                    return (
                      <Radio
                        key={option.id}
                        value={option.id}
                        disabled={option.insufficient_inventory}
                        data-testid="delivery-option-radio"
                        className={optionClass(
                          option.id === shippingMethodId,
                          option.insufficient_inventory
                        )}
                      >
                        <div className="flex items-start gap-x-3">
                          <MedusaRadio
                            checked={option.id === shippingMethodId}
                          />
                          <div className="flex flex-col">
                            <span className="text-[15px] font-semibold text-navy">
                              {option.name}
                            </span>
                            <span className="text-sm text-muted">
                              {formatAddress(
                                (
                                  option as unknown as {
                                    service_zone?: {
                                      fulfillment_set?: {
                                        location?: {
                                          address: HttpTypes.StoreCartAddress
                                        }
                                      }
                                    }
                                  }
                                ).service_zone?.fulfillment_set?.location
                                  ?.address as HttpTypes.StoreCartAddress
                              )}
                            </span>
                          </div>
                        </div>
                        <span className="text-[15px] font-semibold text-navy">
                          <ShippingPrice
                            amount={option.amount}
                            currencyCode={cart.currency_code}
                          />
                        </span>
                      </Radio>
                    )
                  })}
                </RadioGroup>
              </div>
            </div>
          )}

          <ErrorMessage
            error={error}
            data-testid="delivery-option-error-message"
          />
          <Button
            size="large"
            className={`mt-6 ${CHECKOUT_CTA}`}
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={!cart.shipping_methods?.[0]}
            data-testid="submit-delivery-option-button"
          >
            Ödemeye devam et
          </Button>
        </>
      ) : (
        deliveryDone &&
        lastMethod && (
          <StepInfo label="Teslimat yöntemi">
            <p className="flex flex-wrap items-baseline gap-x-2">
              <span className="font-semibold">{lastMethod.name}</span>
              <span className="text-navy/30" aria-hidden>
                ·
              </span>
              <ShippingPrice
                amount={lastMethod.amount}
                currencyCode={cart.currency_code}
              />
            </p>
          </StepInfo>
        )
      )}
    </StepCard>
  )
}

export default Shipping
