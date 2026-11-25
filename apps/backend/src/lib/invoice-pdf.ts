import fs from "fs"
import path from "path"
import PDFDocument from "pdfkit"
import { MedusaError } from "@medusajs/framework/utils"

// Seller details printed on every invoice.
export const INVOICE_SELLER = {
  name: "TAHİR COŞKUN YAPI HIRDAVAT VE İNŞAAT MALZEMELERİ LTD. ŞTİ.",
  address: ["Sümer Mh. 105/5 Sk. No:10", "20020 Merkezefendi / Denizli"],
  phone: "0 (258) 242 34 34",
}

type TaxLine = { rate?: number | null }

type Line = {
  title?: string | null
  variant_title?: string | null
  variant_sku?: string | null
  quantity?: number | null
  unit_price?: number | null
  is_tax_inclusive?: boolean | null
  original_total?: number | null
  total?: number | null
  tax_total?: number | null
  tax_lines?: (TaxLine | null)[] | null
}

type ShippingLine = {
  name?: string | null
  amount?: number | null
  is_tax_inclusive?: boolean | null
  original_total?: number | null
  total?: number | null
  tax_total?: number | null
  tax_lines?: (TaxLine | null)[] | null
}

export type InvoiceOrder = {
  display_id?: number | null
  created_at?: string | Date | null
  email?: string | null
  metadata?: Record<string, unknown> | null
  total?: number | null
  discount_total?: number | null
  billing_address?: {
    first_name?: string | null
    last_name?: string | null
    company?: string | null
    address_1?: string | null
    address_2?: string | null
    city?: string | null
    province?: string | null
    postal_code?: string | null
    phone?: string | null
  } | null
  items?: (Line | null)[] | null
  shipping_methods?: (ShippingLine | null)[] | null
}

type InvoiceMeta = {
  type?: "individual" | "corporate"
  company_name?: string
  tax_office?: string
  tax_number?: string
  tc_number?: string
}

// Fonts live in apps/backend/assets/fonts (Noto Sans, SIL OFL 1.1, see OFL.txt).
// `medusa build` does not copy them, so also look two levels up from
// .medusa/server when running the built app.
const FONT_DIR = [process.cwd(), path.join(process.cwd(), "../..")]
  .map((dir) => path.join(dir, "assets/fonts"))
  .find((dir) => fs.existsSync(path.join(dir, "NotoSans-Regular.ttf")))

const num = (v: unknown) => Number(v ?? 0) || 0

export const formatTL = (amount: number) =>
  `${new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)} TL`

const rateOf = (taxLines?: (TaxLine | null)[] | null) =>
  (taxLines ?? []).reduce((sum, t) => sum + num(t?.rate), 0)

const taxIncluded = (amount: number, inclusive: boolean | null | undefined, rate: number) =>
  inclusive ? amount : amount * (1 + rate / 100)

/** Groups lines by KDV rate: base (matrah) and tax amount, after discounts. */
export function kdvBreakdown(order: InvoiceOrder) {
  const lines = [...(order.items ?? []), ...(order.shipping_methods ?? [])]
  const byRate = new Map<number, { base: number; tax: number }>()
  for (const line of lines) {
    if (!line) continue
    const rate = rateOf(line.tax_lines)
    const entry = byRate.get(rate) ?? { base: 0, tax: 0 }
    entry.tax += num(line.tax_total)
    entry.base += num(line.total) - num(line.tax_total)
    byRate.set(rate, entry)
  }
  return [...byRate.entries()]
    .sort(([a], [b]) => b - a)
    .map(([rate, v]) => ({ rate, ...v }))
}

export function buildInvoicePdf(order: InvoiceOrder): Promise<Buffer> {
  if (!FONT_DIR) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Invoice fonts not found (assets/fonts/NotoSans-*.ttf)"
    )
  }

  const doc = new PDFDocument({
    size: "A4",
    margin: 40,
    info: {
      Title: `Proforma Fatura #${order.display_id}`,
      Author: INVOICE_SELLER.name,
    },
  })
  doc.registerFont("regular", path.join(FONT_DIR, "NotoSans-Regular.ttf"))
  doc.registerFont("bold", path.join(FONT_DIR, "NotoSans-Bold.ttf"))

  const chunks: Buffer[] = []
  doc.on("data", (c: Buffer) => chunks.push(c))
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)
  })

  const left = 40
  const right = 555
  const width = right - left
  const date = new Date(order.created_at ?? Date.now()).toLocaleDateString(
    "tr-TR",
    { timeZone: "Europe/Istanbul", day: "2-digit", month: "2-digit", year: "numeric" }
  )

  // Header: seller (left), document title (right)
  doc.font("bold").fontSize(10).text(INVOICE_SELLER.name, left, 40, { width: 300 })
  doc.font("regular").fontSize(9)
  INVOICE_SELLER.address.forEach((l) => doc.text(l, { width: 300 }))
  doc.text(`Tel: ${INVOICE_SELLER.phone}`, { width: 300 })
  const sellerBottom = doc.y

  doc.font("bold").fontSize(18).text("PROFORMA FATURA", 340, 40, { width: right - 340, align: "right" })
  doc.font("regular").fontSize(9)
  doc.text(`Sipariş No: #${order.display_id}`, 340, doc.y + 4, { width: right - 340, align: "right" })
  doc.text(`Sipariş Tarihi: ${date}`, 340, doc.y, { width: right - 340, align: "right" })

  let y = Math.max(sellerBottom, doc.y) + 10
  doc.rect(left, y, width, 22).fill("#fff4e5")
  doc.fillColor("#8a4b00").font("bold").fontSize(8.5).text(
    "Bu belge bilgilendirme amaçlıdır; e-Fatura / e-Arşiv Fatura yerine geçmez. Yasal faturanız ayrıca düzenlenir.",
    left + 8,
    y + 6,
    { width: width - 16 }
  )
  doc.fillColor("black")
  y += 34

  // Buyer
  const addr = order.billing_address ?? {}
  const inv = ((order.metadata ?? {}).invoice ?? {}) as InvoiceMeta
  const corporate = inv.type === "corporate"
  const buyer: string[] = []
  if (corporate && inv.company_name) buyer.push(inv.company_name)
  const fullName = [addr.first_name, addr.last_name].filter(Boolean).join(" ")
  if (fullName) buyer.push(fullName)
  if (!corporate && addr.company) buyer.push(addr.company)
  if (addr.address_1) buyer.push(addr.address_1)
  if (addr.address_2) buyer.push(addr.address_2)
  const cityLine = [addr.postal_code, [addr.city, addr.province].filter(Boolean).join(" / ")]
    .filter(Boolean)
    .join(" ")
  if (cityLine) buyer.push(cityLine)
  if (addr.phone) buyer.push(`Tel: ${addr.phone}`)
  if (order.email) buyer.push(`E-posta: ${order.email}`)
  if (corporate) {
    if (inv.tax_office) buyer.push(`Vergi Dairesi: ${inv.tax_office}`)
    if (inv.tax_number) buyer.push(`Vergi No: ${inv.tax_number}`)
  } else if (inv.tc_number) {
    buyer.push(`T.C. Kimlik No: ${inv.tc_number}`)
  }

  doc.font("bold").fontSize(10).text(corporate ? "ALICI (Kurumsal)" : "ALICI (Bireysel)", left, y)
  doc.font("regular").fontSize(9)
  buyer.forEach((l) => doc.text(l, { width: 320 }))
  y = doc.y + 16

  // Lines table
  const cols = [
    { label: "Ürün", x: left, w: 235, align: "left" as const },
    { label: "Adet", x: 275, w: 40, align: "right" as const },
    { label: "Birim Fiyat\n(KDV dahil)", x: 320, w: 85, align: "right" as const },
    { label: "KDV", x: 410, w: 40, align: "right" as const },
    { label: "Tutar\n(KDV dahil)", x: 455, w: 100, align: "right" as const },
  ]
  const header = () => {
    doc.rect(left, y, width, 26).fill("#1f2933")
    doc.fillColor("white").font("bold").fontSize(8)
    cols.forEach((c) => doc.text(c.label, c.x + 4, y + 4, { width: c.w - 8, align: c.align }))
    doc.fillColor("black")
    y += 30
  }
  const row = (cells: string[]) => {
    doc.font("regular").fontSize(8.5)
    const h = Math.max(...cells.map((t, i) => doc.heightOfString(t, { width: cols[i].w - 8 })))
    if (y + h > 780) {
      doc.addPage()
      y = 40
      header()
      doc.font("regular").fontSize(8.5)
    }
    cells.forEach((t, i) => doc.text(t, cols[i].x + 4, y, { width: cols[i].w - 8, align: cols[i].align }))
    y += h + 6
    doc.moveTo(left, y - 3).lineTo(right, y - 3).strokeColor("#d9dde3").lineWidth(0.5).stroke()
  }

  header()
  for (const item of order.items ?? []) {
    if (!item) continue
    const rate = rateOf(item.tax_lines)
    const qty = num(item.quantity)
    const unit = taxIncluded(num(item.unit_price), item.is_tax_inclusive, rate)
    const name = [item.title, item.variant_title].filter(Boolean).join(" - ")
    const sku = item.variant_sku ? `\nStok kodu: ${item.variant_sku}` : ""
    row([`${name}${sku}`, String(qty), formatTL(unit), `%${rate}`, formatTL(num(item.original_total ?? item.total))])
  }
  for (const sm of order.shipping_methods ?? []) {
    if (!sm) continue
    const rate = rateOf(sm.tax_lines)
    const unit = taxIncluded(num(sm.amount), sm.is_tax_inclusive, rate)
    row([`Kargo: ${sm.name ?? ""}`, "1", formatTL(unit), `%${rate}`, formatTL(num(sm.original_total ?? sm.total))])
  }

  // Totals
  const totals: [string, string, boolean?][] = []
  const discount = num(order.discount_total)
  if (discount > 0) totals.push(["İndirim (KDV dahil)", `-${formatTL(discount)}`])
  const breakdown = kdvBreakdown(order)
  for (const b of breakdown) {
    totals.push([`KDV Matrahı (%${b.rate})`, formatTL(b.base)])
    totals.push([`Hesaplanan KDV (%${b.rate})`, formatTL(b.tax)])
  }
  totals.push(["GENEL TOPLAM (KDV dahil)", formatTL(num(order.total)), true])

  if (y + totals.length * 16 + 40 > 800) {
    doc.addPage()
    y = 40
  }
  y += 6
  for (const [label, value, strong] of totals) {
    doc.font(strong ? "bold" : "regular").fontSize(strong ? 10.5 : 9)
    doc.text(label, 300, y, { width: 150, align: "right" })
    doc.text(value, 455, y, { width: 96, align: "right" })
    y += strong ? 18 : 14
  }

  doc.font("regular").fontSize(7.5).fillColor("#6b7280").text(
    "Fiyatlara KDV dahildir. Bu proforma fatura sipariş bilgilerinizden otomatik oluşturulmuştur ve mali değeri yoktur.",
    left,
    y + 20,
    { width }
  )

  doc.end()
  return done
}
