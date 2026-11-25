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
  `soft`. Never put `text-white` on `bg-brand` (yellow theme needs dark text). Font Instrument Sans. New header (top bar,
  logo/search bar/account/cart, category bar from DB categories), footer, home page sections
  (`modules/home/components/{hero,category-grid,usp-strip,product-section,promo-banners}`), product
  cards. Store name, contact details and USP texts live in `src/lib/store-config.ts` (phone,
  WhatsApp, address are placeholders). Money formatted with `tr-TR`.
- **Differentiators (2026-11-20)**: (1) "Parça Bul" photo-to-WhatsApp part finder: home section
  `modules/home/components/part-finder`, floating button on every page, top-bar link, CTA on
  search no-results. (2) "Ne yapacaksınız?" job guides: data in `src/lib/projects.ts`, pages
  `/projeler` and `/projeler/[slug]` with a client checklist ("Bende var", missing items sent via
  WhatsApp). Items link to `/search?q=`; once real products exist, add one-click add-to-cart.
  (3) Visual signature: tape-measure ticks (`.tape-ticks`, `TapeMeasure`), blueprint grids
  (`.blueprint-dark/-light`), JetBrains Mono for labels/codes, numbered section eyebrows, rubber
  stamp (`Stamp`) and drawing title block in the hero. WhatsApp number lives in
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
  shows live suggestions (`layout/components/search/bar.tsx`). Checkout has Bireysel/Kurumsal invoice
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
