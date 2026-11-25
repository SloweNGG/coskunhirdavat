"use server"

import { sdk } from "@lib/config"
import { FetchError } from "@medusajs/js-sdk"
import { getAuthHeaders } from "./cookies"

export type StoreReview = {
  id: string
  rating: number
  title: string | null
  content: string
  first_name: string
  last_name: string
  created_at: string
}

export type ProductReviews = {
  reviews: StoreReview[]
  count: number
  average_rating: number
}

export type ReviewFormState = { ok: boolean; message: string } | null

/** Approved reviews of a product. Cached; new approvals show up within a minute. */
export const getProductReviews = async (
  productId: string
): Promise<ProductReviews> =>
  sdk.client
    .fetch<ProductReviews>(`/store/products/${productId}/reviews`, {
      query: { limit: 50 },
      next: { revalidate: 60, tags: [`reviews-${productId}`] },
      cache: "force-cache",
    })
    .catch(() => ({ reviews: [], count: 0, average_rating: 0 }))

/** Lets the client-side form know whether to show itself, without making the page dynamic. */
export const isCustomerLoggedIn = async () =>
  "authorization" in (await getAuthHeaders())

export const addProductReview = async (
  _state: ReviewFormState,
  formData: FormData
): Promise<ReviewFormState> => {
  const headers = await getAuthHeaders()
  if (!("authorization" in headers)) {
    return { ok: false, message: "Yorum yazmak için giriş yapın." }
  }

  try {
    await sdk.client.fetch(`/store/reviews`, {
      method: "POST",
      headers,
      body: {
        product_id: formData.get("product_id"),
        rating: Number(formData.get("rating")),
        title: (formData.get("title") as string) || undefined,
        content: formData.get("content"),
      },
    })
    return {
      ok: true,
      message: "Teşekkürler! Yorumunuz onaylandıktan sonra yayınlanacak.",
    }
  } catch (e) {
    const status = e instanceof FetchError ? e.status : 0
    const message = (e as Error).message
    return {
      ok: false,
      message:
        status === 401
          ? "Oturumunuzun süresi dolmuş. Lütfen tekrar giriş yapın."
          : /zaten/.test(message)
            ? message
            : status === 400
              ? "Lütfen puan seçin ve en az birkaç kelimelik bir yorum yazın."
              : "Yorum gönderilemedi. Lütfen tekrar deneyin.",
    }
  }
}
