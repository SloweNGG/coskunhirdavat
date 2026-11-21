# PayTR payment provider

Medusa v2 payment provider for the PayTR iFrame API (`pp_paytr_paytr`).

## Flow

1. Storefront creates a `pp_paytr_paytr` payment session.
2. Storefront server calls `POST /store/paytr/token` with the cart id and shopper IP.
   The backend reads amount, email, address and basket from the cart and requests a token.
3. The shopper pays inside `https://www.paytr.com/odeme/guvenli/{token}`.
4. PayTR POSTs the result to `/hooks/payment/paytr_paytr`. Medusa answers `OK`, verifies
   the hash and completes the cart, so the order exists even if the shopper closes the tab.
5. PayTR sends the shopper to `<storefront>/api/paytr-return`, which completes the cart
   (idempotent) and shows the confirmation page.

Refunds from the admin call PayTR's `/odeme/iade`.

## PayTR panel settings

- Bildirim URL: `https://<api-domain>/hooks/payment/paytr_paytr`
- Store must be approved for iFrame API.

## Environment

See `apps/backend/.env.template` (`PAYTR_*`). `PAYTR_TEST_MODE` stays on unless set to `false`.
`PAYTR_API_BASE_URL` exists only for pointing at a local mock in tests; never set it in production.

## Setup

    npx medusa exec ./src/scripts/setup-turkey.ts

creates the Türkiye region (TRY, KDV %20, PayTR) and a shipping option.
