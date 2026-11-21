import crypto from "crypto"
import {
  FetchLike,
  buildCallbackHash,
  buildTokenHash,
  encodeBasket,
  oidFromSessionId,
  sessionIdFromOid,
  toPaytrCurrency,
  verifyCallback,
} from "../client"
import PaytrProviderService from "../service"

const creds = {
  merchantId: "123456",
  merchantKey: "KEYKEYKEYKEY",
  merchantSalt: "SALTSALTSALT",
}

const logger = { warn: jest.fn(), info: jest.fn(), error: jest.fn() } as never

// Reference implementation copied from PayTR's Node.js sample, used to
// cross-check our hash builders.
const reference = (msg: string) =>
  crypto.createHmac("sha256", creds.merchantKey).update(msg).digest("base64")

const SESSION_ID = "payses_01JABCDEFGHJKMNPQRSTVWXYZ0"

describe("PayTR client helpers", () => {
  it("builds the iFrame token hash in PayTR's documented order", () => {
    const req = {
      userIp: "85.1.2.3",
      merchantOid: "ORDER1",
      email: "a@b.com",
      paymentAmount: 3456,
      currency: "TL",
      basket: [["Cekic", "34.56", 1]] as never,
      noInstallment: 0 as const,
      maxInstallment: 0,
      userName: "",
      userAddress: "",
      userPhone: "",
      okUrl: "",
      failUrl: "",
      testMode: 1 as const,
      debugOn: 0 as const,
      timeoutLimit: 30,
      lang: "tr" as const,
    }
    const basket = encodeBasket(req.basket)
    const expected = reference(
      "123456" + "85.1.2.3" + "ORDER1" + "a@b.com" + "3456" + basket + "0" + "0" + "TL" + "1" + creds.merchantSalt
    )

    expect(buildTokenHash(creds, req, basket)).toBe(expected)
  })

  it("verifies callback hashes and rejects tampered ones", () => {
    const hash = reference("ORDER1" + creds.merchantSalt + "success" + "3456")

    expect(buildCallbackHash(creds, "ORDER1", "success", "3456")).toBe(hash)
    expect(
      verifyCallback(creds, { merchant_oid: "ORDER1", status: "success", total_amount: "3456", hash })
    ).toBe(true)
    expect(
      verifyCallback(creds, { merchant_oid: "ORDER1", status: "success", total_amount: "9999", hash })
    ).toBe(false)
    expect(verifyCallback(creds, { merchant_oid: "ORDER1" })).toBe(false)
  })

  it("round-trips session ids through merchant_oid", () => {
    const oid = oidFromSessionId(SESSION_ID, "lz3k9a")

    expect(oid).toMatch(/^[0-9A-Za-z]+$/)
    expect(oid.length).toBeLessThanOrEqual(64)
    expect(sessionIdFromOid(oid)).toBe(SESSION_ID)
    expect(sessionIdFromOid("garbage")).toBeNull()
  })

  it("maps currencies", () => {
    expect(toPaytrCurrency("try")).toBe("TL")
    expect(toPaytrCurrency("eur")).toBe("EUR")
    expect(() => toPaytrCurrency("jpy")).toThrow()
  })
})

describe("PaytrProviderService", () => {
  const makeService = (fetchImpl: FetchLike) =>
    new PaytrProviderService({ logger }, {
      ...creds,
      storefrontUrl: "https://magaza.test/",
      testMode: true,
      fetch: fetchImpl,
    })

  const jsonResponse = (body: unknown) =>
    Promise.resolve({ ok: true, status: 200, text: async () => JSON.stringify(body) })

  it("requests an iFrame token with kurus amounts and return URLs", async () => {
    const fetchMock = jest.fn((_url: string, _init: { body: string }) =>
      jsonResponse({ status: "success", token: "tok123" })
    )
    const service = makeService(fetchMock as unknown as FetchLike)

    const out = await service.updatePayment({
      amount: 1234.5,
      currency_code: "try",
      data: {
        session_id: SESSION_ID,
        paytr_request: {
          user_ip: "85.1.2.3",
          email: "müşteri@örnek.com",
          user_name: "Ali Veli",
          user_address: "Istanbul",
          user_phone: "5550000000",
          basket: [["Matkap", "1234.50", 1]],
          cart_id: "cart_1",
          country_code: "tr",
        },
      },
    })

    expect(out.data?.iframe_token).toBe("tok123")
    expect(out.data?.paytr_request).toBeNull()
    expect(sessionIdFromOid(out.data?.merchant_oid as string)).toBe(SESSION_ID)

    const [url, init] = fetchMock.mock.calls[0]
    const form = new URLSearchParams(init.body)
    expect(url).toBe("https://www.paytr.com/odeme/api/get-token")
    expect(form.get("payment_amount")).toBe("123450")
    expect(form.get("currency")).toBe("TL")
    expect(form.get("test_mode")).toBe("1")
    expect(form.get("email")).toBe("musteri@ornek.com")
    expect(form.get("merchant_ok_url")).toBe(
      "https://magaza.test/api/paytr-return?cart_id=cart_1&country_code=tr&status=ok"
    )
  })

  it("throws when PayTR rejects the token request", async () => {
    const service = makeService(() => jsonResponse({ status: "failed", reason: "bad ip" }))

    await expect(
      service.updatePayment({
        amount: 10,
        currency_code: "try",
        data: {
          session_id: SESSION_ID,
          paytr_request: {
            user_ip: "1.1.1.1", email: "a@b.com", user_name: "a", user_address: "b",
            user_phone: "1", basket: [], cart_id: "c", country_code: "tr",
          },
        },
      })
    ).rejects.toThrow("bad ip")
  })

  it("authorizes as captured only when the status query reports success", async () => {
    const paid = makeService(() => jsonResponse({ status: "success", payment_total: "10.00" }))
    const unpaid = makeService(() =>
      jsonResponse({ status: "error", err_no: "004", err_msg: "basarili odeme bulunamadi" })
    )
    const input = { data: { merchant_oid: "x" } }

    expect((await paid.authorizePayment(input)).status).toBe("captured")
    expect((await unpaid.authorizePayment(input)).status).toBe("pending")
    expect((await unpaid.authorizePayment({ data: {} })).status).toBe("pending")
  })

  it("turns a valid success callback into a captured webhook action", async () => {
    const service = makeService(() => jsonResponse({}))
    const oid = oidFromSessionId(SESSION_ID, "abc")
    const hash = buildCallbackHash(creds, oid, "success", "12500")

    const result = await service.getWebhookActionAndData({
      data: { merchant_oid: oid, status: "success", total_amount: "12500", payment_amount: "12000", hash },
      rawData: "",
      headers: {},
    })

    expect(result).toEqual({
      action: "captured",
      data: { session_id: SESSION_ID, amount: 120 },
    })
  })

  it("ignores forged or failed callbacks", async () => {
    const service = makeService(() => jsonResponse({}))
    const oid = oidFromSessionId(SESSION_ID, "abc")

    const forged = await service.getWebhookActionAndData({
      data: { merchant_oid: oid, status: "success", total_amount: "100", hash: "nope" },
      rawData: "",
      headers: {},
    })
    const failed = await service.getWebhookActionAndData({
      data: {
        merchant_oid: oid,
        status: "failed",
        total_amount: "100",
        hash: buildCallbackHash(creds, oid, "failed", "100"),
      },
      rawData: "",
      headers: {},
    })

    expect(forged.action).toBe("not_supported")
    expect(failed.action).toBe("not_supported")
  })

  it("refunds with a period-formatted amount", async () => {
    const fetchMock = jest.fn((_url: string, _init: { body: string }) =>
      jsonResponse({ status: "success", return_amount: "10.25", is_test: 1 })
    )
    const service = makeService(fetchMock as unknown as FetchLike)

    await service.refundPayment({ amount: 10.25, data: { merchant_oid: "OID1" } })

    const form = new URLSearchParams(fetchMock.mock.calls[0][1].body)
    expect(fetchMock.mock.calls[0][0]).toBe("https://www.paytr.com/odeme/iade")
    expect(form.get("return_amount")).toBe("10.25")
    expect(form.get("paytr_token")).toBe(
      reference("123456" + "OID1" + "10.25" + creds.merchantSalt)
    )
  })
})
