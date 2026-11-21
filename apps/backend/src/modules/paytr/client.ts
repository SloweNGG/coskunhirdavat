import crypto from "crypto"
import { MedusaError } from "@medusajs/framework/utils"

/**
 * Thin, dependency-free client for the PayTR iFrame API.
 * Docs: https://dev.paytr.com/iframe-api
 */

export const PAYTR_BASE_URL = "https://www.paytr.com"

export type PaytrCredentials = {
  merchantId: string
  merchantKey: string
  merchantSalt: string
}

export type PaytrBasketItem = [name: string, unitPrice: string, quantity: number]

export type PaytrTokenRequest = {
  userIp: string
  merchantOid: string
  email: string
  /** Amount in minor units (kurus), e.g. 34.56 TL -> 3456 */
  paymentAmount: number
  currency: string
  basket: PaytrBasketItem[]
  noInstallment: 0 | 1
  maxInstallment: number
  userName: string
  userAddress: string
  userPhone: string
  okUrl: string
  failUrl: string
  testMode: 0 | 1
  debugOn: 0 | 1
  timeoutLimit: number
  lang: "tr" | "en"
}

export type PaytrCallbackPayload = {
  merchant_oid?: string
  status?: string
  total_amount?: string
  hash?: string
  payment_amount?: string
  failed_reason_code?: string
  failed_reason_msg?: string
  test_mode?: string
  payment_type?: string
  currency?: string
}

export type FetchLike = (
  url: string,
  init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal }
) => Promise<{ ok: boolean; status: number; text: () => Promise<string> }>

export const hmacBase64 = (message: string, key: string): string =>
  crypto.createHmac("sha256", key).update(message).digest("base64")

/** Constant-time comparison of two base64 hashes. */
export const safeEqual = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)

  if (bufA.length !== bufB.length) {
    return false
  }

  return crypto.timingSafeEqual(bufA, bufB)
}

/** Medusa currency code -> PayTR currency code. */
export const toPaytrCurrency = (currencyCode: string): string => {
  const code = currencyCode.toUpperCase()

  if (code === "TRY" || code === "TL") {
    return "TL"
  }

  if (["EUR", "USD", "GBP", "RUB"].includes(code)) {
    return code
  }

  throw new MedusaError(MedusaError.Types.INVALID_DATA, `PayTR does not support currency ${currencyCode}`)
}

/** 12.5 -> "12.50" (PayTR expects a period as decimal separator). */
export const formatMajorAmount = (minorAmount: number): string =>
  (minorAmount / 100).toFixed(2)

/**
 * PayTR emails must be plain ASCII and order numbers alphanumeric,
 * so normalise Turkish characters out of free text where required.
 */
const TR_MAP: Record<string, string> = {
  ç: "c", Ç: "C", ğ: "g", Ğ: "G", ı: "i", İ: "I",
  ö: "o", Ö: "O", ş: "s", Ş: "S", ü: "u", Ü: "U",
}

export const asciiFold = (value: string): string =>
  value.replace(/[çÇğĞıİöÖşŞüÜ]/g, (c) => TR_MAP[c] ?? c)

export const truncate = (value: string, max: number): string =>
  value.length > max ? value.slice(0, max) : value

export const encodeBasket = (basket: PaytrBasketItem[]): string =>
  Buffer.from(JSON.stringify(basket)).toString("base64")

export const buildTokenHash = (
  creds: PaytrCredentials,
  req: PaytrTokenRequest,
  userBasket: string
): string => {
  const hashStr =
    creds.merchantId +
    req.userIp +
    req.merchantOid +
    req.email +
    String(req.paymentAmount) +
    userBasket +
    String(req.noInstallment) +
    String(req.maxInstallment) +
    req.currency +
    String(req.testMode)

  return hmacBase64(hashStr + creds.merchantSalt, creds.merchantKey)
}

export const buildCallbackHash = (
  creds: PaytrCredentials,
  merchantOid: string,
  status: string,
  totalAmount: string
): string =>
  hmacBase64(
    merchantOid + creds.merchantSalt + status + totalAmount,
    creds.merchantKey
  )

export const verifyCallback = (
  creds: PaytrCredentials,
  payload: PaytrCallbackPayload
): boolean => {
  const { merchant_oid, status, total_amount, hash } = payload

  if (!merchant_oid || !status || total_amount === undefined || !hash) {
    return false
  }

  const expected = buildCallbackHash(creds, merchant_oid, status, total_amount)

  return safeEqual(expected, hash)
}

export const buildStatusHash = (creds: PaytrCredentials, merchantOid: string) =>
  hmacBase64(creds.merchantId + merchantOid + creds.merchantSalt, creds.merchantKey)

export const buildRefundHash = (
  creds: PaytrCredentials,
  merchantOid: string,
  returnAmount: string
) =>
  hmacBase64(
    creds.merchantId + merchantOid + returnAmount + creds.merchantSalt,
    creds.merchantKey
  )

/**
 * Builds a PayTR merchant_oid from a Medusa payment session id.
 * PayTR requires a unique alphanumeric id (max 64) per attempt, so we append
 * an attempt suffix. The session id can be recovered with sessionIdFromOid.
 *
 * payses_01JABCDEFGHJKMNPQRSTVWXYZ0 -> payses01JABCDEFGHJKMNPQRSTVWXYZ0 + "X" + suffix
 */
export const oidFromSessionId = (sessionId: string, suffix: string): string => {
  const [prefix, ulid] = sessionId.split("_")

  if (!prefix || !ulid || !/^[0-9A-Za-z]+$/.test(prefix + ulid)) {
    throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `Unexpected payment session id format: ${sessionId}`)
  }

  const oid = `${prefix}${ulid}X${suffix.replace(/[^0-9A-Za-z]/g, "")}`

  if (oid.length > 64) {
    throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "merchant_oid exceeds 64 characters")
  }

  return oid
}

export const sessionIdFromOid = (merchantOid: string): string | null => {
  const match = /^([a-z]+)([0-9A-Z]{26})X[0-9A-Za-z]+$/.exec(merchantOid)

  if (!match) {
    return null
  }

  return `${match[1]}_${match[2]}`
}

export class PaytrClient {
  constructor(
    private readonly creds: PaytrCredentials,
    // Default parameters also apply when undefined is passed explicitly.
    private readonly fetchImpl: FetchLike = fetch as unknown as FetchLike,
    private readonly baseUrl: string = PAYTR_BASE_URL
  ) {}

  private async post(path: string, form: Record<string, string>) {
    const res = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(form).toString(),
      signal: AbortSignal.timeout(20_000),
    })

    const text = await res.text()

    if (!res.ok) {
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `PayTR ${path} HTTP ${res.status}: ${text.slice(0, 200)}`)
    }

    try {
      return JSON.parse(text) as Record<string, unknown>
    } catch {
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `PayTR ${path} returned non-JSON: ${text.slice(0, 200)}`)
    }
  }

  async getIframeToken(req: PaytrTokenRequest): Promise<string> {
    const userBasket = encodeBasket(req.basket)
    const paytrToken = buildTokenHash(this.creds, req, userBasket)

    const res = await this.post("/odeme/api/get-token", {
      merchant_id: this.creds.merchantId,
      user_ip: req.userIp,
      merchant_oid: req.merchantOid,
      email: req.email,
      payment_amount: String(req.paymentAmount),
      paytr_token: paytrToken,
      user_basket: userBasket,
      debug_on: String(req.debugOn),
      no_installment: String(req.noInstallment),
      max_installment: String(req.maxInstallment),
      user_name: req.userName,
      user_address: req.userAddress,
      user_phone: req.userPhone,
      merchant_ok_url: req.okUrl,
      merchant_fail_url: req.failUrl,
      timeout_limit: String(req.timeoutLimit),
      currency: req.currency,
      test_mode: String(req.testMode),
      lang: req.lang,
    })

    if (res.status !== "success" || typeof res.token !== "string") {
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, `PayTR token request failed: ${String(res.reason ?? "unknown")}`)
    }

    return res.token
  }

  /** Returns the raw status-query response. status === "success" means paid. */
  async queryStatus(merchantOid: string) {
    return this.post("/odeme/durum-sorgu", {
      merchant_id: this.creds.merchantId,
      merchant_oid: merchantOid,
      paytr_token: buildStatusHash(this.creds, merchantOid),
    })
  }

  async refund(merchantOid: string, minorAmount: number) {
    const returnAmount = formatMajorAmount(minorAmount)

    const res = await this.post("/odeme/iade", {
      merchant_id: this.creds.merchantId,
      merchant_oid: merchantOid,
      return_amount: returnAmount,
      paytr_token: buildRefundHash(this.creds, merchantOid, returnAmount),
    })

    if (res.status !== "success") {
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, 
        `PayTR refund failed: ${String(res.err_msg ?? res.status ?? "unknown")}`
      )
    }

    return res
  }
}
