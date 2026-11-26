"use client"

import { Plus, Tag } from "@medusajs/icons"
import { clx } from "@modules/common/components/ui"
import React from "react"

import { applyPromotions } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import Trash from "@modules/common/icons/trash"
import { SUMMARY_TOGGLE } from "../cta-class"
import ErrorMessage from "../error-message"
import { SubmitButton } from "../submit-button"

type DiscountCodeProps = {
  cart: HttpTypes.StoreCart
  /** show the code field right away instead of behind "İndirim kodu ekle" */
  alwaysOpen?: boolean
}

const DiscountCode: React.FC<DiscountCodeProps> = ({
  cart,
  alwaysOpen = false,
}) => {
  const [isOpen, setIsOpen] = React.useState(alwaysOpen)
  const [errorMessage, setErrorMessage] = React.useState("")

  const { promotions = [] } = cart
  const removePromotionCode = async (code: string) => {
    const validPromotions = promotions.filter(
      (promotion) => promotion.code !== code
    )

    await applyPromotions(
      validPromotions.filter((p) => p.code !== undefined).map((p) => p.code!)
    )
  }

  const addPromotionCode = async (formData: FormData) => {
    setErrorMessage("")

    const code = formData.get("code")
    if (!code) {
      return
    }
    const input = document.getElementById("promotion-input") as HTMLInputElement
    const codes = promotions
      .filter((p) => p.code !== undefined)
      .map((p) => p.code!)
    codes.push(code.toString())

    try {
      await applyPromotions(codes)
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : String(e))
    }

    if (input) {
      input.value = ""
    }
  }

  return (
    <div className="flex w-full flex-col">
      <form action={(a) => addPromotionCode(a)} className="w-full">
        {alwaysOpen ? (
          <label
            htmlFor="promotion-input"
            className="mb-1.5 block text-sm font-medium text-navy"
          >
            İndirim kodu
          </label>
        ) : (
          <button
            onClick={() => setIsOpen(!isOpen)}
            type="button"
            aria-expanded={isOpen}
            className={SUMMARY_TOGGLE}
            data-testid="add-discount-button"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-ink">
              <Tag aria-hidden />
            </span>
            İndirim kodu ekle
            <Plus
              aria-hidden
              className={clx(
                "ml-auto text-navy/50 transition-transform",
                isOpen && "rotate-45"
              )}
            />
          </button>
        )}

        {isOpen && (
          <>
            <div className={clx("flex w-full gap-x-2", !alwaysOpen && "mt-2")}>
              <input
                className="h-11 w-full rounded-xl border border-transparent bg-soft px-4 text-[15px] text-navy outline-none placeholder:text-navy/35 focus:border-navy/25 focus:bg-white"
                id="promotion-input"
                name="code"
                type="text"
                placeholder="Kodunuzu girin"
                aria-label={alwaysOpen ? undefined : "İndirim kodu"}
                data-testid="discount-input"
              />
              <SubmitButton
                variant="secondary"
                className="!h-11 !rounded-xl !border-navy/20 !bg-white !px-5 !text-navy !shadow-none"
                data-testid="discount-apply-button"
              >
                Uygula
              </SubmitButton>
            </div>

            <ErrorMessage
              error={errorMessage}
              data-testid="discount-error-message"
            />
          </>
        )}
      </form>

      {promotions.length > 0 && (
        <div className="mt-3 flex w-full flex-col gap-y-2">
          <span className="text-xs font-medium text-muted">
            Uygulanan indirimler
          </span>

          {promotions.map((promotion) => {
            return (
              <div
                key={promotion.id}
                className="flex w-full items-center justify-between gap-x-3 rounded-xl bg-brand-50 px-3 py-2 text-sm text-navy"
                data-testid="discount-row"
              >
                <span
                  className="flex min-w-0 items-center gap-x-2"
                  data-testid="discount-code"
                >
                  <Tag aria-hidden className="shrink-0 text-brand-ink" />
                  <span className="truncate font-mono font-medium">
                    {promotion.code}
                  </span>
                  {promotion.application_method?.value !== undefined &&
                    promotion.application_method.currency_code !==
                      undefined && (
                      <span className="shrink-0 text-muted">
                        (
                        {promotion.application_method.type === "percentage"
                          ? `%${promotion.application_method.value}`
                          : convertToLocale({
                              amount: +promotion.application_method.value,
                              currency_code:
                                promotion.application_method.currency_code,
                            })}
                        )
                      </span>
                    )}
                </span>
                {!promotion.is_automatic && (
                  <button
                    type="button"
                    className="flex shrink-0 items-center text-navy/50 hover:text-sale"
                    onClick={() => {
                      if (!promotion.code) {
                        return
                      }

                      removePromotionCode(promotion.code)
                    }}
                    data-testid="remove-discount-button"
                  >
                    <Trash size={14} />
                    <span className="sr-only">İndirim kodunu kaldır</span>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default DiscountCode
