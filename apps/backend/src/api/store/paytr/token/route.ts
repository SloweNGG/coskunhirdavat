import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { preparePaytrPaymentWorkflow } from "../../../../workflows/prepare-paytr-payment"
import type { StorePaytrTokenType } from "../validators"

/**
 * POST /store/paytr/token
 * Returns a PayTR iFrame token for the cart's PayTR payment session.
 * The storefront server passes the shopper's IP, which PayTR requires.
 */
export const POST = async (
  req: MedusaRequest<StorePaytrTokenType>,
  res: MedusaResponse
) => {
  const { cart_id, user_ip } = req.validatedBody

  const { result } = await preparePaytrPaymentWorkflow(req.scope).run({
    input: { cart_id, user_ip },
  })

  res.json({
    token: result.iframe_token,
    iframe_url: `https://www.paytr.com/odeme/guvenli/${result.iframe_token}`,
  })
}
