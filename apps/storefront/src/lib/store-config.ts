/**
 * Store identity and contact details shown in the header, footer and home page.
 * Values marked TODO are placeholders until the owner provides the real ones.
 */
/** Color theme: "turkuaz" (cyan), "turuncu" (orange), "sari" (yellow) or "mavi" (blue). See styles/globals.css. */
export const STORE_THEME: "turkuaz" | "turuncu" | "sari" | "mavi" = "turkuaz"

export const STORE_INFO = {
  name: "Coşkun Hırdavat",
  shortName: "COŞKUN",
  tagline: "Hırdavat ve Yapı Malzemeleri",
  // TODO: real contact details
  phone: "0 (000) 000 00 00",
  phoneHref: "tel:+900000000000",
  // TODO: real WhatsApp number, digits only with country code (e.g. 905321234567)
  whatsappNumber: "900000000000",
  whatsappHref: "https://wa.me/900000000000",
  email: "info@coskunhirdavat.com",
  address: "Adres bilgisi eklenecek",
  workingHours: "Hafta içi 08:30 - 18:30, Cumartesi 09:00 - 16:00",
  installmentText: "Tüm kartlara taksit imkânı",
  freeShippingText: "Hızlı ve güvenli kargo",
}

/** Icon per category handle; categories without an entry use the default icon. */
export const CATEGORY_ICONS: Record<string, string> = {
  "el-aletleri": "tools",
  "elektrikli-aletler": "bolt",
  "baglanti-elemanlari": "cog",
  "is-guvenligi": "shield",
  "boya-yapi-kimyasallari": "beaker",
  "elektrik-aydinlatma": "light",
  tesisat: "wrench",
  bahce: "sun",
}

export const USP_ITEMS = [
  { icon: "truck", title: "Hızlı Kargo", text: "Siparişleriniz aynı gün kargoda" },
  { icon: "card", title: "Taksit İmkânı", text: "Kredi kartına taksitli ödeme" },
  { icon: "lock", title: "Güvenli Ödeme", text: "PayTR altyapısıyla 3D Secure" },
  { icon: "refresh", title: "Kolay İade", text: "14 gün içinde iade hakkı" },
  { icon: "chat", title: "Uzman Destek", text: "Doğru ürün için bize danışın" },
  { icon: "building", title: "Geniş Ürün Yelpazesi", text: "Binlerce hırdavat ürünü" },
]

/** WhatsApp chat link with a pre-filled message. */
export const whatsappLink = (text: string) =>
  `https://wa.me/${STORE_INFO.whatsappNumber}?text=${encodeURIComponent(text)}`

export const PART_FINDER_MESSAGE =
  "Merhaba, elimdeki parçanın eşini arıyorum. Fotoğrafını gönderiyorum:"
