# Handoff notes (read this first)

Turkish hardware store (hırdavat) e-commerce site. Medusa v2 backend + Next.js storefront monorepo.
The owner is not a developer; talk to them in Turkish, plain language.

## Already done

- **PayTR payment provider** (`apps/backend/src/modules/paytr/`, see its README.md):
  iFrame token via `POST /store/paytr/token` (workflow `src/workflows/prepare-paytr-payment.ts`),
  callback at `/hooks/payment/paytr_paytr` with hash verification, status query on authorize,
  refunds via `/odeme/iade`. Unit tests: `npm run test:unit -- src/modules/paytr` in apps/backend.
- **Türkiye setup script** `apps/backend/src/scripts/setup-turkey.ts`: TRY default currency
  (tax inclusive), Türkiye region with PayTR, KDV 20%, "Standart Kargo" 149.90 TL,
  TRY prices on demo products (EUR x 40).
- **Storefront**: PayTR option in checkout (`payment-button/paytr-payment-button.tsx`),
  server action `src/lib/data/paytr.ts`, return route `src/app/api/paytr-return/route.ts`
  (breaks out of PayTR iFrame, completes cart with retries). Default region `tr`.
- Verified end to end against a local PayTR mock: webhook-only order creation, return-URL order
  creation, failed payment, admin refund, full browser checkout.
- **Storefront redesign (2026-11-20)**: layout inspired by ayber.com (structure only, no copied
  content). Owner chose "antrasit + one vivid accent" with the Open Color cyan scale: active theme
  `turkuaz` (fill cyan 8 #0c8599, hover/ink cyan 9, on-dark accent cyan 4, tints cyan 0/1).
  Alternative themes `turuncu` / `sari` / `mavi`
  are CSS variables in `src/styles/globals.css`, selected by `STORE_THEME` in
  `src/lib/store-config.ts`. Tailwind tokens: `brand` (accent fill), `brand-fg` (text on accent),
  `brand-ink` (accent text on white), `brand-bright` (accent text on navy), `navy` (dark base), `sale` (#C4301C), `line`, `muted`,
  `soft`. Never put `text-white` on `bg-brand` (yellow theme needs dark text). Every WhatsApp button
  is green (owner, 2026-11-26): `bg-whatsapp text-navy hover:bg-whatsapp-dark` (#25D366; white text
  is unreadable on it), WhatsApp text links on white use `text-whatsapp-ink`. Footer payment marks
  are tinted `brand-bright` (TROY/PayTR via CSS mask). Fonts (branch `fix/font-tutarliligi`,
  2026-11-26): next/font in `app/layout.tsx` sets `--font-instrument-sans` (variable 400-700,
  latin + latin-ext, preloaded) and `--font-jetbrains-mono` (400/500, not preloaded);
  `globals.css` :root builds `--font-sans`, `--font-price`, `--font-mono` from them and Tailwind
  `font-sans/price/mono` use only those. Prices are Instrument Sans: owner tried Barlow, then asked
  for the main font (2026-11-26), so Barlow was removed and `--font-price` is `var(--font-sans)`.
  Instrument Sans has no 800: price weights are 700 (product page main price, cards/lists) and 600
  (struck-through); mono
  labels max 500 and at least 12px. Medusa preset `txt-*` / `h*-core` classes hard-code Inter
  (never loaded) and are overridden to `var(--font-sans)` in `globals.css`; don't reintroduce
  Inter. Every price goes through `PriceText` (font-price + tabular-nums). Product option chips are bold, "Paket (10 Adet)" shows the part in brackets
  lighter. The starter's floating-label CSS in `globals.css` now skips radios/checkboxes (it was
  shrinking option chip and checkout checkbox labels). New header (top bar,
  logo/search bar/account/cart, category bar from DB categories), footer, home page sections
  (`modules/home/components/{hero,category-grid,usp-strip,product-section,promo-banners}`), product
  cards. Store name, contact details and USP texts live in `src/lib/store-config.ts` (phone,
  WhatsApp, address are placeholders). Money formatted with `tr-TR`.
- **Differentiators (2026-11-20)**: (1) "Parça Bul" photo-to-WhatsApp part finder: removed completely
  (home/projeler section, floating button, top-bar and search links) at the owner's request
  (2026-11-26). (2) "Ne yapacaksınız?" job guides (`/projeler` pages, home
  section, top-bar link): removed completely at the owner's request (2026-11-26); the code is in
  git history (commit 30572cf) if it is ever wanted back. (3) Visual signature: JetBrains Mono for labels/codes, numbered section eyebrows, rubber
  stamp (`Stamp`) and drawing title block in the hero. Tape-measure ticks and blueprint grid
  backgrounds were removed at the owner's request (2026-11-26); do not bring them back. WhatsApp number lives in
  `STORE_INFO.whatsappNumber` (placeholder).
- Categories: `npx medusa exec ./src/scripts/setup-categories.ts` creates the 8 hardware
  categories (El Aletleri ... Bahçe, handles match `CATEGORY_ICONS`) and hides all others. Idempotent.
- **Turkish UI (2026-11-21)**: all storefront UI strings translated, Medusa CTA removed from checkout,
  order/payment statuses shown with Turkish labels, dates `tr-TR`. Left English on purpose: LLM/UCP
  endpoints (`lib/ucp`, product markdown route), developer-only errors, raw backend/Stripe errors.
  Remaining English on product pages is demo product data in the DB.
- **UX pass (2026-11-21)**: product page in ayber-like layout (gallery + thumbnails, price card,
  quantity stepper, WhatsApp "toplu alım teklifi", share, tabs with spec table, related products from
  the same category, recently viewed). Favorites + recently viewed are kept in localStorage
  (`lib/hooks/use-stored-ids.tsx`), favorites page `/favoriler`. Mobile bottom tab bar. Header search
  shows live suggestions (see "Header search" below). Checkout has Bireysel/Kurumsal invoice
  choice stored in `cart.metadata.invoice` (copied to order metadata; admin sees it under Metadata).
  Free shipping: Standart Kargo is 0 TL when item total >= 3000 TL (price rule in `setup-turkey.ts`,
  must match `FREE_SHIPPING_THRESHOLD` in `store-config.ts`; confirmed by owner 2026-11-21).
  Prices render as "1.026,00 TL" with small raised kuruş (`common/components/price-text`).
- **Product page v2 + checkout (2026-11-21)**: soft rounded gallery, pill option chips (colour options
  show variant images when every value has its own picture), quantity + "Sepete ekle" + "Hemen al"
  (adds then goes to checkout), Kaydet/Paylaş. "Kargo Bedava" badge on cards and product page for
  prices >= FREE_SHIPPING_THRESHOLD (`common/components/free-shipping-badge`). Cart uses the same
  −/+ stepper; free shipping bar sits above the cart. Checkout: postal code optional, İl/İlçe
  dropdowns (`lib/tr-locations.ts`, from npm turkey-neighbourhoods 4.0.3, il -> province,
  ilçe -> city), country hidden while the region has one country.
- **Havale / EFT (2026-11-21)**: Medusa's manual provider `pp_system_default` is enabled on the
  Türkiye region by `setup-turkey.ts` and labelled "Havale / EFT". Bank details live in
  `STORE_INFO.bank` (account holder + 3 accounts: İş Bankası, Vakıf Katılım, Ziraat; IBANs checksum-verified); shown at the payment step and on
  the order confirmation page with the order number as the transfer reference. Orders stay
  "authorized"; the owner captures the payment in admin once the transfer arrives.
- Checkout: phone stored as `+90XXXXXXXXXX`, order note in `metadata.order_note`, marketing consent in
  `metadata.marketing_opt_in`, optional TCKN (checksum-validated) in `metadata.invoice.tc_number`.
- **Recipes from medusajs/examples (2026-11-21)**, all adapted to v2.22 and tested locally:
  - Email: Notification module; Resend when `RESEND_API_KEY`/`RESEND_FROM` set, else console
    (`notification-local`). Templates in `backend/src/lib/emails.ts` (order placed incl. bank info for
    Havale, shipped, password reset, abandoned cart, restock). Storefront reset-password page.
  - Abandoned cart: hourly job, carts idle 24h–7d, only when `cart.metadata.marketing_opt_in === true`.
  - Restock: `restock` module + `POST /store/restock-subscriptions`, job every 15 min; "Gelince haber
    ver" form on out-of-stock product pages.
  - Quotes (B2B): `quote` module, admin "Teklifler" page (edit prices, send/reject), storefront cart
    button "Toplu alım için teklif iste" + `/account/quotes`. Accepted quote = unpaid order (collect
    payment by Havale, mark paid in admin). No counter-offer rounds, no emails yet.
  - Reviews: `product-review` module, admin "Yorumlar" moderation, product page stars + tab, JSON-LD.
  - Re-order: `POST /store/customers/me/orders/:id/reorder`, button on account orders.
  - Category images: admin widget on category page → `metadata.image_url`, shown in home grid.
  - Invoice: proforma PDF (pdfkit + Noto Sans in `backend/assets/fonts`, OFL) — NOT e-Fatura/e-Arşiv.
    Admin widget + customer download (storefront proxy `app/api/invoice/[id]`). Deploy must ship
    `apps/backend/assets/`.
  - Product feed: `GET /product-feed` (Google Merchant RSS, uses `STOREFRONT_URL`).
  - Sentry: `instrumentation.ts`, active only with `SENTRY_DSN`.
  - Usta/bayi prices: built-in customer groups Usta, Bayi, Firma + price lists with
    `customer.groups.id` rules (demo list "Usta fiyatları (deneme)"). Product page fetches the
    logged-in customer's prices after hydration (`getCustomerVariantPrices`); cart prices are server-side.
  - Automatic group discount: admin Settings › "Grup indirimleri" (on/off + % per group, stored in
    customer group metadata). Saving rebuilds generated sale price lists "Otomatik indirim – <group>"
    (`src/lib/group-discounts.ts`); hourly job `sync-group-discounts` picks up new products/prices.
    Do not edit those generated lists by hand; they are deleted and recreated on every sync.
  - Local file uploads use `BACKEND_URL` (default http://localhost:9001) for their URLs.
  - Test data left in the local DB: customers *-test@example.test, test orders/quotes/reviews.
  - Backups before this work: `.backups/before-recipes.tgz` (code) and `hirdavat-before-recipes.dump`.
- Local demo DB only: shorts TRY price set to 3500 and t-shirt variants linked to colour images to
  test badges/swatches. The search index still shows the old shorts price (it reindexes on product
  events, not on raw SQL).
- Search index now stores TRY prices (`PRICE_CURRENCIES` in backend `src/search/helpers/pricing.ts`
  and `SEARCH_PRICE_CURRENCIES` in storefront `src/lib/search-client.ts`). Changing that list needs
  `npx medusa db:migrate` and a backend restart, otherwise facets fail with "not facetable".
- **Shopify product import (2026-11-26)**: `npx medusa exec ./src/scripts/import-shopify-products.ts
  "<csv>" [dry-run]` reads a Shopify product export (helpers in `src/lib/shopify-csv.ts`, tested).
  Loaded the owner's YSB list (`products_export_1 (1).csv` in the repo root, excluded via .git/info/exclude):
  285 products / 455 variants, TRY prices taken as KDV dahil, stock to "Ana Depo", Shopify Type ->
  subcategory via `TYPE_CATEGORY`. `setup-categories.ts` now holds a category tree: 5 new top-level
  categories (Ölçü ve Kontrol, Kaynak, Kesme ve Aşındırma, Kaldırma ve Taşıma, Paketleme) plus
  subcategories. Option-less products get the placeholder option "Seçenek: Standart"
  (`src/lib/default-option.ts`, skipped in search facets). Images still load from cdn.shopify.com:
  copy them to own storage before go-live. Descriptions are plain text, passed through
  `cleanDescription` (src/lib/shopify-csv.ts, tested): links to ysb.com.tr, YSB's shipping policy
  (2.500 TL free shipping, 15:00 cut-off) and its seller promises ("YSB olarak ... servis",
  "YSB Güvencesi") are removed; brand copy such as "YSB güvencesiyle ..." and "Neden YSB ...?" stays.
  The original HTML is no longer stored: product metadata is public in the store API and page
  source, and it leaked those texts (removed 2026-11-26 by `src/scripts/clean-product-descriptions.ts`,
  which also strips "| YSB" from `metadata.seo_title`; metadata keys are deleted by sending "").
  Backup before: `.backups/hirdavat-2026-11-26-oncesi-aciklama.dump`. 9 duplicate SKUs were left
  empty (`metadata.shopify_sku`). Cost per item was
  not imported. `src/scripts/reindex-search.ts` rebuilds the search index. Do not put test files
  under `src/search/` (Medusa loads every file there). Catalog data on the storefront refreshes
  within 60 s (see the fixes below); Cmd+Shift+R shows it at once in dev.
- **Categories and navbar (2026-11-26, owner request)**: `setup-categories.ts` is the single source of
  the tree (array order = navbar order; it renames/reorders existing categories) and shows a category
  only while it or a subcategory has a published product (`syncCategoryVisibility`, also run at the
  end of the import). Empty ones (El Aletleri, Bağlantı, Boya, Tesisat, Bahçe) and Manyetik Kaynak
  Tutucular (its 3 products are drafts) are hidden; re-run the script after adding products to them.
  `import-shopify-products.ts ... recategorize` moves existing products to their mapped category
  (`HANDLE_CATEGORY` overrides single products). Old subcategory "Cetvel, Pergel ve Diğer" is empty
  and hidden. Demo products set to draft by `hide-demo-products.ts`. Storefront: desktop
  `layout/components/category-bar` (one shared mega menu, client component, rebuilt 2026-11-26 after
  the owner's ysb.com.tr reference: left rail of top categories, subcategory cards with picture +
  product count, "Öne çıkanlar" with prices, USP strip + WhatsApp link. The bar itself is a
  "floating capsule" the owner picked: rounded track tinted `brand-100` (owner wanted it blue), categories
  as pills, the open one a white pill with a shadow, "Tüm Kategoriler" a brand pill. The sticky
  header always stays full width and stuck to the top (owner's explicit wish; a floating inset card
  was tried and rejected). Once scrolled past 40px only its bottom corners ease to `rounded-b-[40px]`
  and a soft shadow replaces the bottom border (`layout/components/header-shell` sets
  `data-scrolled`; the last visible row rounds itself via `group-data-[scrolled=true]/header:`,
  category bar on desktop, main row on mobile; nothing clips, so the mega menu can hang out). The
  mega menu opens as a separate rounded card below, as wide as the page content; categories that don't fit
  drop out of the bar instead of being cut). Footer (`layout/templates/footer`, 2026-11-26) mirrors
  it: `rounded-t-[40px]` navy panel with a soft brand glow, brand column (logo, short range text,
  phone + WhatsApp pills), link columns with brand-colored uppercase headings and a hover accent
  line, contact items in icon tiles. On the home page it slides 40px over the help band
  (`[data-footer-overlap]+footer`, band has the extra bottom padding) so the corners show the band's
  colour; the band must stay the last section of the home page for that. Its counts, subcategory fallback pictures and featured
  products come from the search index (`lib/data/mega-menu.ts`, batched `/store/search`, max 20
  queries per request, cached 10 min). Featured = products tagged `FEATURED_PRODUCT_TAG`
  ("öne çıkan", store-config), topped up with the category's highest-priced ones. Mobile side menu
  lists subcategories, category pages show active subcategories as chips (the store API also
  returns inactive children, filtered in `categories/templates`). Backup before this:
  `.backups/hirdavat-2026-11-26-oncesi-kategori.dump`. Home copy now describes the current range
  (hero text, side promos -> Ölçü ve Kontrol / Kaldırma ve Taşıma, tagline "Hırdavat ve Endüstriyel
  Malzemeler", USP, page title/description); revisit it when El Aletleri etc. get products.
  Category images: `image` (a product handle) on each top-level entry in `setup-categories.ts`
  fills an empty `metadata.image_url` with that product's thumbnail (never overwrites an admin
  choice). The home category grid shows it uncropped (object-contain) and the two hero promo cards
  use the images of Ölçü ve Kontrol / Kaldırma ve Taşıma, falling back to icons. These URLs point at
  cdn.shopify.com too, so rewrite them along with product images when moving to own storage.
- **Fixes from a health check (2026-11-26)**: (1) `resend` was imported by `src/modules/resend` but
  never installed, so setting `RESEND_API_KEY` would have crashed the backend; now a backend
  dependency (verified booting with a fake key). (2) Storefront catalog fetches (products,
  categories, collections, regions, variants, locales) were `force-cache` with no lifetime, so admin
  changes would never reach a production storefront; `getCacheOptions` in `lib/data/cookies.ts` now
  adds `revalidate: CATALOG_REVALIDATE_SECONDS` (60) for those tags. Per-customer data (cart,
  orders, customer) is unchanged. (3) Storefront lint errors from the starter fixed (unused gift-card
  stubs removed from `lib/data/cart.ts`, `any` replaced, needless `@ts-ignore` removed); `npm run
  lint` passes. Known, not fixed: `tsc` on the backend reports TS2786 in every admin `.tsx` because
  npm ignores the root `pnpm.overrides`, leaving @types/react 18 (backend) and 19 (storefront)
  side by side; the admin builds with Vite and works, so it is types-only.
- **Product gallery (2026-11-26, owner request)**: from `small` up the thumbnails sit in a column
  left of the main photo (`products/components/image-gallery`), as tall as the photo and scrolling
  when a product has more (up to 13 now); phones keep the row under the photo. Zoom (owner: no
  zoom on mere hover): a mouse click on the main photo turns a 2x magnifier on, which follows the
  pointer; another click or leaving the photo turns it off. Touch taps, keyboard Enter and the
  corner "Tam ekran görüntüle" button open `image-lightbox.tsx`
  (Headless UI Dialog): click/tap zooms 2.5x at that point and follows the pointer, arrows, arrow
  keys (window listener, focus can leave the panel), swipes and the thumbnail row change photo,
  Esc closes, and the page photo follows the viewer. Tested in headless Chrome (desktop + touch).
- **USP strip (2026-11-26, owner request)**: `home/components/usp-strip` is one bordered card whose
  1px dividers come from `gap-px` over `bg-line` (2 / 3 / 6 columns), with brand-tinted round icons.
  `USP_ITEMS` texts in `store-config.ts` were shortened to fit one line each; the category-bar menu
  shows the first three of them too.
- **Hero slider, managed in the admin (2026-11-26, owner request)**: the dark main banner of the
  home hero is a slider (`home/components/hero/slider.tsx` client, `slide.tsx` per slide); the
  side promo cards are unchanged. Slides live in the backend module `hero-slide` (table
  `hero_slide`: eyebrow, title, accent, description, two buttons (text + link: "/path", "#anchor"
  or http(s)), image_url, image_style card|background, theme dark|brand|light, show_stamp (stamp +
  CH-001 title block), duration (s), is_active, rank, starts_at/ends_at). Admin page "Ana Sayfa
  Slaytları" (`src/admin/routes/hero-slides/page.tsx`): list with order arrows, on/off switch,
  status (Yayında / Kapalı / başlar / Süresi doldu), drawer form with image upload
  (`/admin/uploads`) and a rough preview. API: `GET/POST /admin/hero-slides`,
  `POST/DELETE /admin/hero-slides/:id`, `POST /admin/hero-slides/reorder` (validates its own body:
  the `:id` middleware matches that path too), `GET /store/hero-slides` (active + in schedule,
  ordered). Logic in `src/workflows/hero-slides.ts` (delete is a soft delete). Storefront reads
  them via `lib/data/hero-slides.ts` (revalidate 60 s, so changes show within a minute); with no
  slides it shows a built-in store slide (`DEFAULT_SLIDE` in `hero/index.tsx`). The first slide's
  heading is the page h1. Phones show card images too (wide white card above the text). Controls
  (owner, 2026-11-26: "more minimal, dots in the bottom-right corner"): only small round dots, the
  active one white; no arrows, counter or capsule. On a slide with the stamp the dots move above
  its title block on large screens (`cornerBlocks`). Autoplay: an invisible `hero-progress`
  animation inside the active dot times the slide, pausing on hover, focus and touch drag; dots,
  arrow keys, swipes change slides; inactive slides are `inert`; no autoplay for reduced motion. Starting slides: `npx medusa exec ./src/scripts/seed-hero-slides.ts` (only
  when there are none; run it on a new database after `setup-categories.ts`). Validator tests:
  `src/lib/__tests__/hero-slide-validators.unit.spec.ts`. The owner first tried a product showcase
  and a search-first hero (both rejected, 2026-11-26).
- **Sign-in / register page (2026-11-26, owner's choice)**: `account/templates/login-template.tsx`.
  Desktop: both forms side by side and a turquoise panel (owner picked "kayan turkuaz panel" and
  turquoise buttons) slides over the inactive one; the panel lists member benefits
  (`MEMBER_BENEFITS` in `account/components/auth-ui`) and a WhatsApp help link. Phones: capsule
  tabs, the form slides in, benefits card below. View is in the URL (`/account?view=register`,
  `history.pushState`, back button works). Forms submit via `onSubmit` + `startTransition` so a
  failed attempt keeps the fields (React resets uncontrolled fields after `<form action>`).
  Register: Ad/Soyad side by side, the checkout `PhoneInput` (+90, stored `+90XXXXXXXXXX`, optional),
  min 8 character password with strength bar, legal links fixed to `/terms` and `/privacy`.
  Login shows "Üye olmadan devam et" (to checkout) when the cart has items. `Input` gained
  `labelAction` ("Şifremi unuttum" sits on the label row), `optional`, and a Caps Lock warning on
  every password field. Signed-out account layout no longer reserves the 240px nav column or shows
  the "Sorunuz mu var?" band, and is `max-w-6xl` instead of `5xl`. Owner wants the card to fit the
  screen without scrolling: it is 536px tall on desktop (fits a 1280x760 viewport below the
  header); from `medium` E-posta and Telefon share a row, the password hint is one line. Keep it
  compact when adding fields (e.g. KVKK checkboxes). Still to do (server side): Turkish texts for raw backend errors, a
  clear message when registering with an existing e-mail, return to the cart after sign-in,
  KVKK aydınlatma metni + separate marketing consent on register.

- **Header search (2026-11-26, owner request)**: `layout/components/search/search-box.tsx`, one
  component for the desktop bar and the mobile drawer. Looks like the category capsule (rounded
  pill track, brand "Ara" pill); its dropdown is a card like the mega menu. Empty (owner asked for
  product pictures there): recent searches (localStorage `coskun:recent-searches`),
  `POPULAR_SEARCHES` chips each with the picture of the term's best match, categories, and a
  picture column "Son baktığınız ürünler" (from `coskun:recently-viewed`) + "Popüler ürünler"
  (products tagged `FEATURED_PRODUCT_TAG`, else each popular term's best match); data from
  `GET /api/search/discover` (`getSearchDiscovery`, shared part cached 10 min), loaded when the
  box opens or is hovered. Two columns from `medium` up. Typing: matching categories with counts
  (category picture when it has one), products with 56px pictures, prices and the typed words
  highlighted, "tüm sonuçlar (N)"; arrows/Enter/Escape, "/" focuses it on desktop.
  Data comes from the storefront route `GET /api/search/suggest` (`lib/data/search.ts`
  `searchCatalog`). The Postgres search provider has no typo tolerance and no highlighting, so:
  a query with 0 hits is retried with its unknown words corrected against the words of all
  product titles (`lib/search/text.ts`, vocabulary rebuilt every 10 min), e.g. "lazr" -> "lazer",
  "matkp" -> "matkap"; highlighting is done client-side. Diacritics ("olcu" = "ölçü") and partial
  words already work in the backend. The search page `/search` now uses the same index (it used
  Medusa's `q`, which gave different counts and nothing for "olcu"), with the same typo fallback,
  pagination (24 per page) and a WhatsApp help link when nothing is found; it falls back to `q` if
  the index is down. The old InstantSearch drawer panel, `bar.tsx` and `hit.tsx` are gone.
- **Admin "Özet" page (2026-11-26)**: `/app/overview` (sidebar "Özet"), page in
  `backend/src/admin/routes/overview/`, pieces in `src/admin/components/overview/`, helpers and chart
  colours in `src/admin/lib/overview.ts`. Data from `GET /admin/dashboard/sales?days=7|30|90`
  (totals vs previous period, daily buckets in Türkiye time, top 5 products, payment-method split;
  default currency only, canceled/draft orders excluded) and `GET /admin/dashboard/pending`
  (unpaid Havale orders = `pp_system_default` collections still authorized, quotes
  `pending_merchant`, reviews `pending`, published variants with <= 5 available). Charts are
  hand-drawn SVG (no chart library); colours validated for colour-blind separation: turquoise
  `#1098ad`/`#15aabf` (light/dark), orange `#e8590c`/`#e76624`. Order page widget
  `widgets/order-checkout-details.tsx` shows invoice type, tax details, order note, e-mail consent
  and "Para bekleniyor" for unpaid Havale orders.
- **Checkout in the store theme (2026-11-26, owner request)**: header is the store `Logo` +
  "Güvenli ödeme" badge + phone + "Sepete dön" (no search/category bar). The split layout and step
  order are unchanged; each step is a `checkout/components/step-card` (replaces `step-title`):
  rounded card like the cart page, navy number when open (turquoise outline), turquoise check when
  done, "Düzenle" pill, finished-step summaries with mono labels (`StepInfo`). Stepper capsule is
  brand-50 with turquoise progress. Delivery/payment rows share `optionClass` (cta-class.ts),
  `common/components/radio` is a turquoise dot (visual only, Headless UI carries the role) and
  `common/components/checkbox` is a native `accent-brand` checkbox (submits "on", same as before).
  0 TL shipping reads "Ücretsiz"; payment methods have a `description` line in `lib/constants.tsx`.
  Summary: "İndirim kodu / Sipariş notu ekle" rows with icons, applied codes as turquoise chips
  (also on the cart page), trust strip from `USP_ITEMS` (truck/lock/refresh). Bank account holder
  name wraps instead of truncating. `getInvoiceLines` in `order/components/invoice-details` feeds
  both the checkout summary and the order page.
- **Logo (2026-11-26, owner's design)**: the owner's "C" mark (white C with a swoosh on black),
  traced to a vector path (`LOGO_MARK_PATH` / `LogoMark` in `layout/components/logo`), white on a
  `bg-brand` tile next to the "COŞKUN / HIRDAVAT" text (header, footer, checkout). Icons:
  `src/app/icon.svg` (tab, rounded tile), `src/app/apple-icon.png` (180px, full bleed) and
  `public/favicon.ico` (16/32/48, replaced the Vercel triangle). The icon files hard-code the
  turkuaz brand colour #0c8599 (CSS variables do not reach them): regenerate them if `STORE_THEME`
  changes. Still starter content: `src/app/opengraph-image.jpg` / `twitter-image.jpg` (link
  previews show "Next.js Starter Template").
- **"23 Yıl" shimmer (2026-11-26, owner request)**: `layout/components/anniversary-badge`. Every 5 s
  a light band (clipped to the gold digits) sweeps across and three yellow sparkles twinkle as it
  passes (Tailwind `gold-shine` / `gold-twinkle` keyframes); hidden with prefers-reduced-motion.
- **Floating WhatsApp button (2026-11-26, owner request)**: `layout/components/whatsapp-button`,
  bottom-right on every `(main)` page (not checkout), green with a white glyph (owner asked for
  white; WhatsApp buttons with text keep navy text), hover label on desktop, message `WHATSAPP_BUTTON_MESSAGE` in store-config.
  Phones: sits above the tab bar; fades out while the product page's sticky add-to-cart bar is up
  (`data-sticky-bar` on that bar + `.whatsapp-fab` rule in globals.css). New fixed bottom bars
  should carry `data-sticky-bar` too.
- **Demo orders (local only)**: `npx medusa exec ./src/scripts/demo-orders.ts` adds 45 Havale orders
  over 60 days (`metadata.demo_seed`), `... demo-orders.ts sil` soft-deletes them and deletes their
  demo-N@example.test guest customers. Added and removed again on 2026-11-26 (owner's request); the
  local DB has no orders now. `setup-turkey.ts` was re-run the same day because Havale/EFT was not
  yet enabled on the local Türkiye region.

- **Product description layout + admin editor (2026-11-26, owner request)**: descriptions stay plain
  text in `product.description` (so feeds/search/JSON-LD are unchanged) and are parsed into
  headings, paragraphs, lists, spec rows and Q&A by `parseDescription` (backend
  `src/lib/product-description.ts`, an identical copy in storefront `src/lib/util/` — a unit test
  fails if they differ; edit one and copy). Rules: "Başlık:" line, "• madde", "• Başlık: açıklama"
  (feature cards when most items have one), short "Etiket: değer" -> spec row, "Soru?" + answer on the
  next line (or after a blank line under a "Sık Sorulan Sorular" heading). It also understands the
  imported Shopify shapes (label and value on separate lines, title lines without colon). Spec rows
  move to the "Teknik bilgiler" card (product fields fill in labels not already there); if a label
  repeats (several models in one text) the tables stay inline. Storefront:
  `products/components/product-description`, used by `product-tabs`. Admin: product page widget
  "Ürün açıklaması" (`src/admin/widgets/product-description.tsx`) shows the store look and opens a
  full-screen editor (insert buttons, rules, example template, live preview); it saves
  `description`. Tests: `npm run test:unit -- src/lib/__tests__/product-description`.

## First-time local setup

1. Requirements: Node.js >= 22, Docker Desktop, Git.
2. `docker compose up -d` (Postgres on 5432, Redis on 6379; user/pass `medusa`, db `hirdavat`).
3. `cp apps/backend/.env.template apps/backend/.env`, set
   `DATABASE_URL=postgres://medusa:medusa@localhost:5432/hirdavat`, generate random `JWT_SECRET`
   and `COOKIE_SECRET`, fill `PAYTR_*` with the owner's PayTR test credentials
   (PayTR panel: merchant id / key / salt). Keep `PAYTR_TEST_MODE=true`.
4. `npm install` at the repo root.
5. In apps/backend: `npx medusa db:migrate` (also runs the demo seed), then
   `npx medusa exec ./src/scripts/setup-turkey.ts`, then
   `npx medusa exec ./src/scripts/setup-categories.ts`, then create an admin user with
   `npx medusa user -e <email> -p <password>`.
6. Get the publishable key (`select token from api_key where type='publishable'`, or Admin >
   Settings > Publishable API Keys), `cp apps/storefront/.env.template apps/storefront/.env.local`
   and set `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`. Set `PAYTR_DEV_USER_IP` to the owner's public IP
   (PayTR rejects local IPs).
7. `npm run dev` at the root. Storefront http://localhost:8000, admin http://localhost:9000/app.

PayTR cannot call localhost back, so locally an order completes via the return URL + status
query. The callback (`Bildirim URL`) only works once the backend is on a public domain.

## Next tasks (in order)

1. Done (2026-11-21): Turkish UI.
2. Branding and a hardware-store home page: categories, featured products. Ask the owner for
   store name, logo, colors, categories.
3. Legal pages: KVKK, mesafeli satış sözleşmesi, ön bilgilendirme formu, iade koşulları, iletişim,
   plus a required-consent checkbox at checkout.
4. Remove demo products; help the owner import real products (CSV import in admin).
5. Production: VPS (4 vCPU / 8 GB), Docker Compose with Caddy, Redis-backed Medusa modules
   (event bus, workflow engine, caching), separate `medusa-worker`, S3/R2 file provider,
   email (Resend), backups. Set PayTR Bildirim URL to
   `https://<api-domain>/hooks/payment/paytr_paytr`, then `PAYTR_TEST_MODE=false`.
   The owner already has a PayTR account; PayTR hands out the merchant id / key / salt only after the
   live domain is registered with them (owner, 2026-11-26). Until then `.env` holds fake `PAYTR_*`
   values, so choosing PayTR at a local checkout fails; test checkout locally with Havale / EFT.
