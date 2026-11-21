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
- Local DB: 8 hardware categories created (El Aletleri ... Bahçe), demo categories set inactive.
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
   `npx medusa exec ./src/scripts/setup-turkey.ts`, then create an admin user with
   `npx medusa user -e <email> -p <password>`.
6. Get the publishable key (`select token from api_key where type='publishable'`, or Admin >
   Settings > Publishable API Keys), `cp apps/storefront/.env.template apps/storefront/.env.local`
   and set `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`. Set `PAYTR_DEV_USER_IP` to the owner's public IP
   (PayTR rejects local IPs).
7. `npm run dev` at the root. Storefront http://localhost:8000, admin http://localhost:9000/app.

PayTR cannot call localhost back, so locally an order completes via the return URL + status
query. The callback (`Bildirim URL`) only works once the backend is on a public domain.

## Next tasks (in order)

1. Translate the entire storefront UI to Turkish (all hardcoded English strings), rename
   "Medusa Store", remove starter/GitHub content on the home page.
2. Branding and a hardware-store home page: categories, featured products. Ask the owner for
   store name, logo, colors, categories.
3. Legal pages: KVKK, mesafeli satış sözleşmesi, ön bilgilendirme formu, iade koşulları, iletişim,
   plus a required-consent checkbox at checkout.
4. Remove demo products; help the owner import real products (CSV import in admin).
5. Production: VPS (4 vCPU / 8 GB), Docker Compose with Caddy, Redis-backed Medusa modules
   (event bus, workflow engine, caching), separate `medusa-worker`, S3/R2 file provider,
   email (Resend), backups. Set PayTR Bildirim URL to
   `https://<api-domain>/hooks/payment/paytr_paytr`, then `PAYTR_TEST_MODE=false`.
