import { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

/**
 * Transactional email templates (Turkish) and a small send helper.
 * Emails are rendered here and passed to the Notification Module as `content`,
 * so any `email` channel provider (Resend, or the local logger in dev) can send them.
 */

export const STORE_NAME = "Coşkun Hırdavat"
export const STOREFRONT_URL = (
  process.env.STOREFRONT_URL ||
  process.env.PAYTR_STOREFRONT_URL ||
  "http://localhost:8000"
).replace(/\/$/, "")
export const COUNTRY_CODE = "tr"

// Keep in sync with STORE_INFO.bank in apps/storefront/src/lib/store-config.ts
export const BANK_INFO = {
  accountHolder: "TAHİR COŞKUN YAPI HIRDAVAT VE İNŞAAT MALZEMELERİ LTD. ŞTİ.",
  accounts: [
    { name: "İş Bankası", iban: "TR09 0006 4000 0013 2021 7001 33" },
    { name: "Vakıf Katılım", iban: "TR17 0021 0000 0006 7589 2000 01" },
    { name: "Ziraat Bankası", iban: "TR79 0001 0021 4397 5826 0350 01" },
  ],
}

// Medusa's manual payment provider, shown as "Havale / EFT" in the storefront.
export const BANK_TRANSFER_PROVIDER_ID = "pp_system_default"

export type RenderedEmail = { subject: string; html: string }

export const esc = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

/** 1026 -> "1.026,00 TL" (amounts are in major units, tax inclusive). */
export const formatTL = (amount: unknown) =>
  `${new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount ?? 0))} TL`

const button = (href: string, label: string) =>
  `<p style="margin:24px 0"><a href="${esc(href)}" style="display:inline-block;background:#0c8599;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 24px;border-radius:999px">${esc(label)}</a></p>`

const layout = (title: string, body: string) => `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#1f2933">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#1f2933;color:#ffffff;padding:20px 24px;font-size:20px;font-weight:700">${esc(STORE_NAME)}</td></tr>
<tr><td style="padding:24px;font-size:15px;line-height:1.55">
<h1 style="font-size:20px;margin:0 0 16px">${esc(title)}</h1>
${body}
</td></tr>
<tr><td style="padding:16px 24px;background:#f4f5f7;font-size:12px;color:#6b7280">${esc(STORE_NAME)} · <a href="${esc(STOREFRONT_URL)}/${COUNTRY_CODE}" style="color:#0c8599">${esc(STOREFRONT_URL.replace(/^https?:\/\//, ""))}</a></td></tr>
</table></td></tr></table></body></html>`

type Address = {
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

const addressHtml = (a: Address) =>
  a
    ? [
        [a.first_name, a.last_name].filter(Boolean).join(" "),
        a.company,
        a.address_1,
        a.address_2,
        [a.postal_code, a.city, a.province].filter(Boolean).join(" "),
        a.phone,
      ]
        .filter(Boolean)
        .map(esc)
        .join("<br>")
    : ""

type Item = {
  title?: string | null
  product_title?: string | null
  variant_title?: string | null
  quantity?: unknown
  total?: unknown
}

const itemsTable = (items: Item[]) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:16px 0">${items
    .map(
      (i) => `<tr style="border-bottom:1px solid #e5e7eb">
<td style="padding:8px 0">${esc(i.product_title || i.title)}${
        i.variant_title && i.variant_title !== "Default variant"
          ? `<br><span style="color:#6b7280;font-size:13px">${esc(i.variant_title)}</span>`
          : ""
      }</td>
<td style="padding:8px;white-space:nowrap;color:#6b7280">${esc(i.quantity)} adet</td>
<td style="padding:8px 0;text-align:right;white-space:nowrap">${formatTL(i.total)}</td></tr>`
    )
    .join("")}</table>`

const row = (label: string, value: string, bold = false) =>
  `<tr><td style="padding:4px 0;${bold ? "font-weight:700" : "color:#6b7280"}">${esc(label)}</td><td style="padding:4px 0;text-align:right;${bold ? "font-weight:700" : ""}">${esc(value)}</td></tr>`

export type OrderEmailData = {
  display_id?: unknown
  items?: Item[] | null
  subtotal?: unknown
  item_total?: unknown
  shipping_total?: unknown
  discount_total?: unknown
  tax_total?: unknown
  total?: unknown
  shipping_address?: Address
  bank_transfer?: boolean
}

export function orderPlacedEmail(order: OrderEmailData): RenderedEmail {
  const no = `#${order.display_id}`
  const bank = order.bank_transfer
    ? `<div style="background:#e3fafc;border-radius:12px;padding:16px;margin:16px 0">
<strong>Havale / EFT bilgileri</strong><br>
Ödemenizi aşağıdaki hesaplardan birine yapabilirsiniz. Lütfen açıklama kısmına sipariş numaranızı (<strong>${esc(no)}</strong>) yazınız.<br><br>
Hesap sahibi: <strong>${esc(BANK_INFO.accountHolder)}</strong><br>
${BANK_INFO.accounts.map((a) => `${esc(a.name)}: <span style="font-family:monospace">${esc(a.iban)}</span>`).join("<br>")}
<br><br>Ödemeniz hesabımıza ulaştığında siparişiniz hazırlanmaya başlanacaktır.</div>`
    : ""
  const discount = Number(order.discount_total ?? 0)

  return {
    subject: `Siparişiniz alındı (${no}) - ${STORE_NAME}`,
    html: layout(
      "Siparişiniz için teşekkür ederiz",
      `<p>Sipariş numaranız: <strong>${esc(no)}</strong></p>
${bank}
${itemsTable(order.items ?? [])}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${row("Ara toplam", formatTL(order.item_total ?? order.subtotal))}
${discount > 0 ? row("İndirim", `-${formatTL(discount)}`) : ""}
${row("Kargo", Number(order.shipping_total ?? 0) > 0 ? formatTL(order.shipping_total) : "Ücretsiz")}
${row("Toplam (KDV dahil)", formatTL(order.total), true)}
${row("Dahil KDV", formatTL(order.tax_total))}
</table>
${order.shipping_address ? `<p style="margin-top:20px"><strong>Teslimat adresi</strong><br>${addressHtml(order.shipping_address)}</p>` : ""}
<p>Siparişinizle ilgili sorularınız için bize bu e-postayı yanıtlayarak ulaşabilirsiniz.</p>`
    ),
  }
}

export function orderShippedEmail(data: {
  display_id?: unknown
  tracking?: { tracking_number?: string | null; url?: string | null }[]
}): RenderedEmail {
  const no = `#${data.display_id}`
  const tracking = (data.tracking ?? []).filter((t) => t.tracking_number)
  return {
    subject: `Siparişiniz kargoya verildi (${no}) - ${STORE_NAME}`,
    html: layout(
      "Siparişiniz kargoya verildi",
      `<p><strong>${esc(no)}</strong> numaralı siparişiniz kargoya teslim edildi.</p>
${tracking
  .map((t) =>
    t.url && /^https?:\/\//.test(t.url)
      ? `<p>Takip numarası: <a href="${esc(t.url)}" style="color:#0c8599">${esc(t.tracking_number)}</a></p>`
      : `<p>Takip numarası: <strong>${esc(t.tracking_number)}</strong></p>`
  )
  .join("")}
${button(`${STOREFRONT_URL}/${COUNTRY_CODE}/account/orders`, "Siparişlerimi görüntüle")}`
    ),
  }
}

export function passwordResetEmail(resetUrl: string): RenderedEmail {
  return {
    subject: `Şifre sıfırlama - ${STORE_NAME}`,
    html: layout(
      "Şifrenizi sıfırlayın",
      `<p>Hesabınız için şifre sıfırlama talebi aldık. Yeni şifrenizi belirlemek için aşağıdaki butona tıklayınız. Bağlantı 15 dakika geçerlidir.</p>
${button(resetUrl, "Yeni şifre belirle")}
<p style="color:#6b7280;font-size:13px">Bu talebi siz yapmadıysanız bu e-postayı dikkate almayınız; şifreniz değişmeyecektir.</p>`
    ),
  }
}

export function abandonedCartEmail(data: {
  cart_id: string
  items: Item[]
}): RenderedEmail {
  return {
    subject: `Sepetinizde ürünler sizi bekliyor - ${STORE_NAME}`,
    html: layout(
      "Sepetinizi unutmayın",
      `<p>Sepetinize eklediğiniz ürünler hâlâ sizi bekliyor. Kaldığınız yerden devam etmek ister misiniz?</p>
${itemsTable(data.items)}
${button(`${STOREFRONT_URL}/${COUNTRY_CODE}/cart/resume/${encodeURIComponent(data.cart_id)}`, "Alışverişe devam et")}`
    ),
  }
}

export function restockEmail(data: {
  product_title: string
  variant_title?: string | null
  product_handle?: string | null
  variant_id: string
}): RenderedEmail {
  const name = [data.product_title, data.variant_title !== "Default variant" ? data.variant_title : null]
    .filter(Boolean)
    .join(" - ")
  const url = data.product_handle
    ? `${STOREFRONT_URL}/${COUNTRY_CODE}/products/${encodeURIComponent(data.product_handle)}?v_id=${encodeURIComponent(data.variant_id)}`
    : `${STOREFRONT_URL}/${COUNTRY_CODE}`
  return {
    subject: `Beklediğiniz ürün stokta - ${STORE_NAME}`,
    html: layout(
      "Beklediğiniz ürün tekrar stokta",
      `<p><strong>${esc(name)}</strong> tekrar stoklarımızda. Stoklar tükenmeden siparişinizi verebilirsiniz.</p>
${button(url, "Ürünü görüntüle")}`
    ),
  }
}

/** Sends a rendered email through the Notification Module's `email` channel. */
export async function sendEmail(
  container: MedusaContainer,
  input: {
    to: string
    template: string
    email: RenderedEmail
    data?: Record<string, unknown>
    idempotency_key?: string
    resource_id?: string
    resource_type?: string
  }
) {
  const notification = container.resolve(Modules.NOTIFICATION)
  return notification.createNotifications({
    to: input.to,
    channel: "email",
    template: input.template,
    data: { subject: input.email.subject, ...(input.data ?? {}) },
    content: { subject: input.email.subject, html: input.email.html },
    idempotency_key: input.idempotency_key,
    resource_id: input.resource_id,
    resource_type: input.resource_type,
  })
}
