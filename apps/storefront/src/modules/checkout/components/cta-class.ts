import { clx } from "@modules/common/components/ui"

/** Full-width dark call-to-action used by every checkout step button. */
export const CHECKOUT_CTA =
  "w-full !h-12 !rounded-xl !bg-navy !text-white !text-[15px] !font-semibold !shadow-none hover:!bg-navy/90 disabled:!opacity-40"

/** "İndirim kodu ekle" / "Sipariş notu ekle" rows in the checkout summary. */
export const SUMMARY_TOGGLE =
  "-mx-2 flex h-12 w-[calc(100%+1rem)] items-center gap-x-3 rounded-xl px-2 text-left text-sm font-semibold text-navy transition-colors hover:bg-soft"

/** Selectable delivery / payment row; the chosen one gets the turquoise outline. */
export const optionClass = (selected: boolean, disabled = false) =>
  clx(
    "mb-2 flex cursor-pointer items-center justify-between gap-x-4 rounded-xl border px-4 py-3.5 outline-none transition-colors last:mb-0 focus-visible:ring-2 focus-visible:ring-brand/40",
    selected
      ? "border-brand bg-brand-50/60 ring-1 ring-brand"
      : "border-line hover:border-navy/30",
    disabled && "cursor-not-allowed opacity-50 hover:border-line"
  )
