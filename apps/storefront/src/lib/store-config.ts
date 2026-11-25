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
  phone: "0 (258) 242 34 34",
  phoneHref: "tel:+902582423434",
  // WhatsApp: digits only with country code
  whatsappNumber: "905363996656",
  whatsappHref: "https://wa.me/905363996656",
  email: "info@coskunhirdavat.com",
  address: "Sümer Mh. 105/5 Sk. No:10, 20020 Merkezefendi / Denizli",
  workingHours: "Hafta içi 08:00 - 18:00, Cumartesi 08:00 - 17:00",
  // Havale / EFT accounts (IBAN checksums verified)
  bank: {
    accountHolder: "TAHİR COŞKUN YAPI HIRDAVAT VE İNŞAAT MALZEMELERİ LTD. ŞTİ.",
    // logo: square bank symbol cropped from the official logo (public/images/banks)
    accounts: [
      {
        name: "İş Bankası",
        iban: "TR09 0006 4000 0013 2021 7001 33",
        logo: "/images/banks/isbank.svg",
      },
      {
        name: "Vakıf Katılım",
        iban: "TR17 0021 0000 0006 7589 2000 01",
        logo: "/images/banks/vakif-katilim.svg",
      },
      {
        name: "Ziraat Bankası",
        iban: "TR79 0001 0021 4397 5826 0350 01",
        logo: "/images/banks/ziraat.svg",
      },
    ],
  },
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
  {
    icon: "truck",
    title: "Hızlı Kargo",
    text: "Siparişleriniz aynı gün kargoda",
  },
  {
    icon: "card",
    title: "Taksit İmkânı",
    text: "Kredi kartına taksitli ödeme",
  },
  {
    icon: "lock",
    title: "Güvenli Ödeme",
    text: "PayTR altyapısıyla 3D Secure",
  },
  { icon: "refresh", title: "Kolay İade", text: "14 gün içinde iade hakkı" },
  { icon: "chat", title: "Uzman Destek", text: "Doğru ürün için bize danışın" },
  {
    icon: "building",
    title: "Geniş Ürün Yelpazesi",
    text: "Binlerce hırdavat ürünü",
  },
]

/** WhatsApp chat link with a pre-filled message. */
export const whatsappLink = (text: string) =>
  `https://wa.me/${STORE_INFO.whatsappNumber}?text=${encodeURIComponent(text)}`

export const PART_FINDER_MESSAGE =
  "Merhaba, elimdeki parçanın eşini arıyorum. Fotoğrafını gönderiyorum:"

/**
 * Cart item total (KDV dahil, TRY) from which Standart Kargo is free.
 * Must match FREE_SHIPPING_THRESHOLD_TRY in apps/backend/src/scripts/setup-turkey.ts.
 */
export const FREE_SHIPPING_THRESHOLD = 3000

/** "Hemen al" (add to cart and go to checkout) on the product page. Hidden for now. */
export const SHOW_BUY_NOW = false
