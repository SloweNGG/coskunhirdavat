"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders } from "./cookies"

/** Subscribes an email to a "back in stock" email for an out-of-stock variant. */
export async function subscribeToRestock(variantId: string, email: string) {
  try {
    await sdk.client.fetch("/store/restock-subscriptions", {
      method: "POST",
      body: { variant_id: variantId, email },
      headers: { ...(await getAuthHeaders()) },
    })
    return { success: true as const }
  } catch (e) {
    return {
      success: false as const,
      error:
        (e as { status?: number }).status === 400
          ? "Lütfen geçerli bir e-posta adresi girin."
          : "Şu anda kaydınızı alamadık. Lütfen daha sonra tekrar deneyin.",
    }
  }
}
