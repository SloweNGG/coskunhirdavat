import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { updateReviewStatusWorkflow } from "../../../../workflows/update-review-status"
import type { AdminUpdateReviewStatusType } from "./validators"

/** POST /admin/reviews/status — approve / reject reviews in bulk. */
export const POST = async (
  req: MedusaRequest<AdminUpdateReviewStatusType>,
  res: MedusaResponse
) => {
  const { result } = await updateReviewStatusWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  res.json({ reviews: result })
}
