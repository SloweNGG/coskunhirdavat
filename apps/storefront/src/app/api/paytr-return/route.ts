import { placeOrder } from "@lib/data/cart"
import { setCartId } from "@lib/data/cookies"
import { unstable_rethrow } from "next/navigation"
import { NextRequest, NextResponse } from "next/server"

/**
 * PayTR sends the shopper here (merchant_ok_url / merchant_fail_url) after the
 * payment form. The order itself is confirmed by PayTR's server callback to
 * the backend; this route only completes the cart for the shopper and shows
 * the confirmation page.
 */
const breakOutOfIframe = (url: string) =>
  new NextResponse(
    `<!doctype html><html><head><meta charset="utf-8"><title>Yönlendiriliyor</title></head>` +
      `<body><p>Yönlendiriliyorsunuz...</p><script>` +
      `var u=${JSON.stringify(url)};` +
      `if(window.top&&window.top!==window.self){window.top.location.href=u}else{window.location.replace(u)}` +
      `</script></body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8" } }
  )

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function handle(req: NextRequest) {
  const { origin, searchParams } = req.nextUrl
  const cartId = searchParams.get("cart_id")
  const countryCode = searchParams.get("country_code")
  const status = searchParams.get("status")
  const prefix = countryCode ? `/${countryCode.replace(/[^a-z]/gi, "")}` : ""

  // PayTR loads this URL inside its iFrame; continue in the top window.
  if (searchParams.get("top") !== "1") {
    const next = new URL(req.nextUrl)
    next.searchParams.set("top", "1")
    return breakOutOfIframe(next.pathname + next.search)
  }

  if (!cartId || !cartId.startsWith("cart_")) {
    return NextResponse.redirect(`${origin}${prefix}/cart?error=payment_failed`)
  }

  await setCartId(cartId)

  if (status !== "ok") {
    return NextResponse.redirect(
      `${origin}${prefix}/checkout?step=review&paytr=failed`
    )
  }

  // The status query can lag PayTR's redirect by a moment, and the backend
  // webhook may complete the cart first; completing again returns that order.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      await placeOrder(cartId) // redirects to the confirmation page on success
    } catch (error) {
      unstable_rethrow(error)
    }
    await sleep(1500)
  }

  return NextResponse.redirect(`${origin}${prefix}/cart?error=order_failed`)
}

export const GET = handle
export const POST = handle
