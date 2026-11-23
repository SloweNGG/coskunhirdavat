import { isEmpty } from "./isEmpty"

type ConvertToLocaleParams = {
  amount: number
  currency_code: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
}

export const convertToLocale = ({
  amount,
  currency_code,
  minimumFractionDigits,
  maximumFractionDigits,
  locale = "tr-TR",
}: ConvertToLocaleParams) => {
  if (currency_code?.toLowerCase() === "try") {
    // Turkish shops write "1.026,00 TL" rather than "₺1.026,00"
    return `${new Intl.NumberFormat(locale, {
      minimumFractionDigits:
        minimumFractionDigits ?? Math.min(2, maximumFractionDigits ?? 2),
      maximumFractionDigits: maximumFractionDigits ?? 2,
    }).format(amount)} TL`
  }

  return currency_code && !isEmpty(currency_code)
    ? new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency_code,
        minimumFractionDigits,
        maximumFractionDigits,
      }).format(amount)
    : amount.toString()
}
