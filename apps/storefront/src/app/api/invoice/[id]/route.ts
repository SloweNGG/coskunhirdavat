import { getAuthHeaders } from "@lib/data/cookies"
import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

// Proxies the logged-in customer's proforma invoice PDF. The JWT lives in an
// httpOnly cookie, so the browser cannot call the backend route directly.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await getAuthHeaders()
  if (!("authorization" in auth)) {
    return new NextResponse("Giriş yapmanız gerekiyor.", { status: 401 })
  }

  const res = await fetch(
    `${BACKEND_URL}/store/customers/me/orders/${encodeURIComponent(id)}/invoice`,
    {
      headers: {
        ...auth,
        "x-publishable-api-key":
          process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "",
      },
      cache: "no-store",
    }
  )
  if (!res.ok) {
    return new NextResponse("Fatura bulunamadı.", { status: res.status })
  }

  return new NextResponse(res.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition":
        res.headers.get("content-disposition") ??
        `attachment; filename="proforma-fatura.pdf"`,
      "Cache-Control": "private, no-store",
    },
  })
}
