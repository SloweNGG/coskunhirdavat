"use client"

import {
  addProductReview,
  isCustomerLoggedIn,
  ProductReviews as ProductReviewsData,
} from "@lib/data/reviews"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { clx } from "@modules/common/components/ui"
import { useActionState, useEffect, useState } from "react"
import Stars from "./stars"

const ProductReviews = ({
  productId,
  data,
}: {
  productId: string
  data: ProductReviewsData
}) => (
  <div className="grid grid-cols-1 gap-8 small:grid-cols-[1fr_minmax(0,380px)]">
    <div>
      {data.count > 0 ? (
        <>
          <div className="mb-5 flex items-center gap-3">
            <span className="text-3xl font-semibold text-navy">
              {data.average_rating.toLocaleString("tr-TR")}
            </span>
            <div>
              <Stars rating={data.average_rating} className="text-lg" />
              <p className="text-xs text-muted">{data.count} değerlendirme</p>
            </div>
          </div>
          <ul className="flex flex-col gap-4">
            {data.reviews.map((r) => (
              <li key={r.id} className="rounded-2xl border border-line p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Stars rating={r.rating} />
                  <span className="text-xs text-muted">
                    {r.first_name} {r.last_name} ·{" "}
                    {new Date(r.created_at).toLocaleDateString("tr-TR")}
                  </span>
                </div>
                {r.title && <p className="mt-2 font-semibold text-navy">{r.title}</p>}
                <p className="mt-1 whitespace-pre-line">{r.content}</p>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>Bu ürün için henüz değerlendirme yok. İlk yorumu siz yazın.</p>
      )}
    </div>
    <ReviewForm productId={productId} />
  </div>
)

const ReviewForm = ({ productId }: { productId: string }) => {
  // The product page is static, so the login state is read via a server action.
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)
  const [rating, setRating] = useState(0)
  const [state, formAction, pending] = useActionState(addProductReview, null)

  useEffect(() => {
    isCustomerLoggedIn().then(setLoggedIn).catch(() => setLoggedIn(false))
  }, [])

  if (loggedIn === null) {
    return null
  }

  if (!loggedIn) {
    return (
      <div className="h-fit rounded-2xl border border-line bg-soft p-5">
        <p className="font-semibold text-navy">Yorum yazmak için giriş yapın</p>
        <p className="mt-1 text-muted">
          Satın aldığınız ürünü değerlendirerek diğer müşterilere yardımcı olun.
        </p>
        <LocalizedClientLink
          href="/account"
          className="mt-4 inline-flex rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-fg hover:bg-brand-dark"
        >
          Giriş yap
        </LocalizedClientLink>
      </div>
    )
  }

  if (state?.ok) {
    return (
      <div className="h-fit rounded-2xl border border-line bg-soft p-5 font-medium text-navy" role="status">
        {state.message}
      </div>
    )
  }

  return (
    <form action={formAction} className="flex h-fit flex-col gap-3 rounded-2xl border border-line p-5">
      <p className="font-semibold text-navy">Değerlendirme yazın</p>
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="rating" value={rating} />
      <fieldset>
        <legend className="mb-1 text-xs text-muted">Puanınız</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} yıldız`}
              aria-pressed={rating === n}
              className={clx(
                "text-2xl leading-none transition-colors",
                n <= rating ? "text-amber-500" : "text-line hover:text-amber-300"
              )}
            >
              ★
            </button>
          ))}
        </div>
      </fieldset>
      <input
        name="title"
        maxLength={120}
        placeholder="Başlık (isteğe bağlı)"
        aria-label="Başlık"
        className="rounded-lg border border-line px-3 py-2 outline-none focus:border-brand"
      />
      <textarea
        name="content"
        required
        minLength={3}
        maxLength={2000}
        rows={4}
        placeholder="Ürün hakkındaki görüşleriniz"
        aria-label="Yorumunuz"
        className="rounded-lg border border-line px-3 py-2 outline-none focus:border-brand"
      />
      {state && !state.ok && (
        <p className="text-sm text-sale" role="alert">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending || !rating}
        className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-brand-fg hover:bg-brand-dark disabled:opacity-50"
      >
        {pending ? "Gönderiliyor..." : "Gönder"}
      </button>
    </form>
  )
}

export default ProductReviews
