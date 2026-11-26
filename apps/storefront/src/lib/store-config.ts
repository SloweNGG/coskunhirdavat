/**
 * Store identity and contact details shown in the header, footer and home page.
 * Values marked TODO are placeholders until the owner provides the real ones.
 */
/** Color theme: "turkuaz" (cyan), "turuncu" (orange), "sari" (yellow) or "mavi" (blue). See styles/globals.css. */
export const STORE_THEME: "turkuaz" | "turuncu" | "sari" | "mavi" = "turkuaz"

export const STORE_INFO = {
  name: "Coşkun Hırdavat",
  shortName: "COŞKUN",
  tagline: "Hırdavat ve Endüstriyel Malzemeler",
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
  "olcu-kontrol-aletleri": "measure",
  "kaynak-malzemeleri": "fire",
  "kesme-asindirma": "sparkles",
  "kaldirma-tasima": "handTruck",
  "paketleme-ambalaj": "box",
}

export const USP_ITEMS = [
  {
    icon: "truck",
    title: "Hızlı Kargo",
    text: "Aynı gün kargoda",
  },
  {
    icon: "card",
    title: "Taksit İmkânı",
    text: "Kredi kartına taksit",
  },
  {
    icon: "lock",
    title: "Güvenli Ödeme",
    text: "PayTR ile 3D Secure",
  },
  { icon: "refresh", title: "Kolay İade", text: "14 gün içinde iade" },
  { icon: "chat", title: "Uzman Destek", text: "Uzman ekibe danışın" },
  {
    icon: "building",
    title: "Geniş Yelpaze",
    text: "Yüzlerce ürün çeşidi",
  },
]

/** WhatsApp chat link with a pre-filled message. */
export const whatsappLink = (text: string) =>
  `https://wa.me/${STORE_INFO.whatsappNumber}?text=${encodeURIComponent(text)}`

/**
 * Cart item total (KDV dahil, TRY) from which Standart Kargo is free.
 * Must match FREE_SHIPPING_THRESHOLD_TRY in apps/backend/src/scripts/setup-turkey.ts.
 */
export const FREE_SHIPPING_THRESHOLD = 3000

/** "Hemen al" (add to cart and go to checkout) on the product page. Hidden for now. */
export const SHOW_BUY_NOW = false

/**
 * Product tag (exact, case-sensitive) that puts a product under "Öne çıkanlar"
 * in its category's menu. Categories without tagged products show their
 * highest-priced products instead.
 */
export const FEATURED_PRODUCT_TAG = "öne çıkan"

/** Pre-filled WhatsApp message behind the menu's "can't find it" link. */
/** Pre-filled message of the floating WhatsApp button (bottom-right of every page). */
export const WHATSAPP_BUTTON_MESSAGE = "Merhaba, bilgi almak istiyorum."

export const MENU_HELP_MESSAGE =
  "Merhaba, aradığım ürünü bulamadım. Yardımcı olur musunuz?"

/**
 * Shown under "Popüler aramalar" when the header search box is focused and
 * empty. Edit freely; each term should find products.
 */
export const POPULAR_SEARCHES = [
  "lazer metre",
  "caraskal",
  "su terazisi",
  "kumpas",
  "transpalet",
  "kaynak teli",
]

/** The header search box's placeholder (screen readers get "Ürün ara"). */
export const SEARCH_PLACEHOLDER = "Ürün, kategori veya model kodu ara..."

/**
 * Typed one after another into the empty, unfocused header search box, after
 * SEARCH_PLACEHOLDER (shown as "Kumpas...", "Streç film..."). Edit freely;
 * each name should find products (all of these did on 2026-11-26).
 */
export const SEARCH_PLACEHOLDER_WORDS = [
  "Kumpas",
  "Streç film",
  "Caraskal",
  "Tungsten elektrot",
  "Çember makinesi",
  "Su terazisi",
  "Transpalet",
  "Elmas testere",
  "Kaynak teli",
  "İş eldiveni",
]

/** Pre-filled WhatsApp message when a search finds nothing. */
export const searchHelpMessage = (query: string) =>
  `Merhaba, sitede "${query}" aradım ama bulamadım. Yardımcı olur musunuz?`
