import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  Logger,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types"
import {
  AbstractPaymentProvider,
  MathBN,
  MedusaError,
  PaymentActions,
} from "@medusajs/framework/utils"
import {
  FetchLike,
  PaytrBasketItem,
  PaytrCallbackPayload,
  PaytrClient,
  asciiFold,
  oidFromSessionId,
  sessionIdFromOid,
  toPaytrCurrency,
  truncate,
  verifyCallback,
} from "./client"

export type PaytrOptions = {
  merchantId: string
  merchantKey: string
  merchantSalt: string
  /** Public storefront URL, used for merchant_ok_url / merchant_fail_url. */
  storefrontUrl: string
  testMode?: boolean
  debug?: boolean
  /** 0 = PayTR maximum, otherwise 2-12. */
  maxInstallment?: number
  noInstallment?: boolean
  /** Minutes the iFrame token stays valid. */
  timeoutLimit?: number
  lang?: "tr" | "en"
  /** Override for a local mock server in tests. Defaults to https://www.paytr.com */
  apiBaseUrl?: string
  /** Injected in tests. */
  fetch?: FetchLike
}

/**
 * Data the store API route collects from the cart (server-side, trusted)
 * and passes through updatePaymentSession to request an iFrame token.
 */
export type PaytrTokenRequestData = {
  user_ip: string
  email: string
  user_name: string
  user_address: string
  user_phone: string
  basket: PaytrBasketItem[]
  cart_id: string
  country_code: string
}

type InjectedDependencies = {
  logger: Logger
}

const toMinor = (amount: unknown): number =>
  MathBN.mult(MathBN.convert(amount as never), 100)
    .integerValue()
    .toNumber()

class PaytrProviderService extends AbstractPaymentProvider<PaytrOptions> {
  static identifier = "paytr"

  protected logger_: Logger
  protected options_: PaytrOptions
  protected client_: PaytrClient

  static validateOptions(options: Record<string, unknown>) {
    for (const key of ["merchantId", "merchantKey", "merchantSalt", "storefrontUrl"]) {
      if (!options[key]) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `PayTR provider option "${key}" is required`
        )
      }
    }
  }

  constructor(container: InjectedDependencies, options: PaytrOptions) {
    super(container, options)

    this.logger_ = container.logger
    this.options_ = options
    this.client_ = new PaytrClient(
      {
        merchantId: options.merchantId,
        merchantKey: options.merchantKey,
        merchantSalt: options.merchantSalt,
      },
      options.fetch,
      options.apiBaseUrl
    )
  }

  async initiatePayment(
    input: InitiatePaymentInput
  ): Promise<InitiatePaymentOutput> {
    const sessionId = String(input.data?.session_id ?? "")

    // Validate early so an unsupported currency fails at checkout selection.
    const currency = toPaytrCurrency(input.currency_code)

    return {
      id: sessionId,
      status: "pending",
      data: {
        session_id: sessionId,
        amount_minor: toMinor(input.amount),
        currency,
      },
    }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    const data = input.data ?? {}
    const amountMinor = toMinor(input.amount)
    const currency = toPaytrCurrency(input.currency_code)
    const request = data.paytr_request as PaytrTokenRequestData | undefined | null

    if (!request) {
      // Amount or currency changed: any previously issued token is stale.
      return {
        status: "pending",
        data: { amount_minor: amountMinor, currency, iframe_token: null },
      }
    }

    const sessionId = String(data.session_id ?? "")
    const merchantOid = oidFromSessionId(sessionId, Date.now().toString(36))
    const base = this.options_.storefrontUrl.replace(/\/$/, "")
    const returnUrl = (status: "ok" | "fail") =>
      `${base}/api/paytr-return?` +
      new URLSearchParams({
        cart_id: request.cart_id,
        country_code: request.country_code,
        status,
      }).toString()

    const token = await this.client_.getIframeToken({
      userIp: request.user_ip,
      merchantOid,
      email: truncate(asciiFold(request.email), 100),
      paymentAmount: amountMinor,
      currency,
      basket: request.basket,
      noInstallment: this.options_.noInstallment ? 1 : 0,
      maxInstallment: this.options_.maxInstallment ?? 0,
      userName: truncate(request.user_name, 60),
      userAddress: truncate(request.user_address, 400),
      userPhone: truncate(request.user_phone, 20),
      okUrl: returnUrl("ok"),
      failUrl: returnUrl("fail"),
      testMode: this.options_.testMode ? 1 : 0,
      debugOn: this.options_.debug ? 1 : 0,
      timeoutLimit: this.options_.timeoutLimit ?? 30,
      lang: this.options_.lang ?? "tr",
    })

    return {
      status: "pending",
      data: {
        merchant_oid: merchantOid,
        iframe_token: token,
        token_created_at: new Date().toISOString(),
        amount_minor: amountMinor,
        currency,
        paytr_request: null,
      },
    }
  }

  /**
   * Called when the cart is completed (storefront return or webhook).
   * PayTR captures immediately, so a successful payment is reported as captured.
   */
  async authorizePayment(
    input: AuthorizePaymentInput
  ): Promise<AuthorizePaymentOutput> {
    const { status, data } = await this.getPaymentStatus(input)

    return { status, data: { ...input.data, ...data } }
  }

  async getPaymentStatus(
    input: GetPaymentStatusInput
  ): Promise<GetPaymentStatusOutput> {
    const merchantOid = input.data?.merchant_oid as string | undefined

    if (!merchantOid) {
      return { status: "pending", data: input.data }
    }

    const res = await this.client_.queryStatus(merchantOid)

    if (res.status === "success") {
      return {
        status: "captured",
        data: {
          paytr_payment_total: res.payment_total ?? null,
          paytr_installment: res.taksit ?? null,
          paytr_card_brand: res.kart_marka ?? null,
          paytr_masked_pan: res.masked_pan ?? null,
          paytr_test_mode: res.test_mode ?? null,
        },
      }
    }

    // "merchant_oid ile basarili odeme bulunamadi" -> not paid (yet)
    return { status: "pending", data: { paytr_last_error: res.err_msg ?? null } }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    // PayTR captures at authorization time; nothing to do.
    return { data: input.data }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const merchantOid = input.data?.merchant_oid as string | undefined

    if (!merchantOid) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Cannot refund a PayTR payment without merchant_oid"
      )
    }

    const res = await this.client_.refund(merchantOid, toMinor(input.amount))

    return {
      data: {
        ...input.data,
        paytr_last_refund: {
          amount: res.return_amount ?? null,
          is_test: res.is_test ?? null,
          at: new Date().toISOString(),
        },
      },
    }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    // PayTR has no void for an unpaid iFrame token; it simply expires.
    return { data: input.data }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: input.data }
  }

  async retrievePayment(
    input: RetrievePaymentInput
  ): Promise<RetrievePaymentOutput> {
    return { data: input.data }
  }

  async getWebhookActionAndData(
    payload: ProviderWebhookPayload["payload"]
  ): Promise<WebhookActionResult> {
    const body = (payload.data ?? {}) as PaytrCallbackPayload

    if (!verifyCallback(this.options_, body)) {
      this.logger_.warn(
        `PayTR callback rejected: bad hash (merchant_oid=${body.merchant_oid ?? "?"})`
      )
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    const sessionId = sessionIdFromOid(body.merchant_oid!)

    if (!sessionId) {
      this.logger_.warn(`PayTR callback with unknown merchant_oid ${body.merchant_oid}`)
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    if (body.status !== "success") {
      // A failed attempt: the customer can retry with a new token on the same session.
      this.logger_.info(
        `PayTR payment failed for ${sessionId}: ${body.failed_reason_code ?? ""} ${body.failed_reason_msg ?? ""}`
      )
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    // payment_amount is the order amount; total_amount may include installment interest.
    const minor = Number(body.payment_amount ?? body.total_amount)

    return {
      action: PaymentActions.SUCCESSFUL,
      data: { session_id: sessionId, amount: minor / 100 },
    }
  }
}

export default PaytrProviderService
