"use server"

import { sdk } from "@lib/config"
import { headers } from "next/headers"
import { getAuthHeaders, getCartId } from "./cookies"

export type PaytrIframeResult = { iframeUrl: string } | { error: string }

const GENERIC_ERROR =
  "Ödeme formu yüklenemedi. Lütfen sayfayı yenileyip tekrar deneyin."

/**
 * PayTR needs the shopper's public IP. Behind Vercel/Cloudflare it arrives in
 * these headers; locally there is none, so PAYTR_DEV_USER_IP can supply one.
 */
const getShopperIp = async (): Promise<string> => {
  const h = await headers()
  const candidates = [
    h.get("cf-connecting-ip"),
    h.get("x-real-ip"),
    h.get("x-forwarded-for")?.split(",")[0],
  ]
  const ip = candidates.map((v) => v?.trim()).find((v) => !!v)

  if (ip && ip !== "::1" && ip !== "127.0.0.1") {
    return ip.replace(/^::ffff:/, "")
  }

  return process.env.PAYTR_DEV_USER_IP || "127.0.0.1"
}

/** Asks the backend for a PayTR iFrame token for the current cart. */
export async function getPaytrIframe(
  cartId?: string
): Promise<PaytrIframeResult> {
  const id = cartId || (await getCartId())

  if (!id) {
    return { error: GENERIC_ERROR }
  }

  try {
    const res = await sdk.client.fetch<{ token: string; iframe_url: string }>(
      "/store/paytr/token",
      {
        method: "POST",
        body: { cart_id: id, user_ip: await getShopperIp() },
        headers: { ...(await getAuthHeaders()) },
        cache: "no-store",
      }
    )

    return { iframeUrl: res.iframe_url }
  } catch (error) {
    console.error("PayTR token error", error)
    return { error: GENERIC_ERROR }
  }
}
