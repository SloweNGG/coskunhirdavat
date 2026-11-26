import { Metadata } from "next"
import { Suspense } from "react"

import { retrieveCart } from "@lib/data/cart"
import LoginTemplate from "@modules/account/templates/login-template"

export const metadata: Metadata = {
  title: "Giriş yap",
  description: "Coşkun Hırdavat hesabınıza giriş yapın.",
}

export default async function Login() {
  // Only the item count matters here: a filled cart gets a "continue without
  // an account" link to checkout.
  const cart = await retrieveCart(undefined, "id,*items").catch(() => null)
  const guestCheckoutHref = cart?.items?.length
    ? "/checkout?step=address"
    : null

  return (
    <Suspense>
      <LoginTemplate guestCheckoutHref={guestCheckoutHref} />
    </Suspense>
  )
}
