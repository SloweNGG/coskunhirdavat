import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { PRODUCT_REVIEW_MODULE } from "../modules/product-review"
import ProductReviewModuleService from "../modules/product-review/service"

export type UpdateReviewStatusInput = {
  ids: string[]
  status: "pending" | "approved" | "rejected"
}

const updateReviewStatusStep = createStep(
  "update-review-status",
  async ({ ids, status }: UpdateReviewStatusInput, { container }) => {
    const reviewService: ProductReviewModuleService =
      container.resolve(PRODUCT_REVIEW_MODULE)

    const original = await reviewService.listReviews(
      { id: ids },
      { select: ["id", "status"] }
    )
    const reviews = await reviewService.updateReviews(
      ids.map((id) => ({ id, status }))
    )

    return new StepResponse(
      reviews,
      original.map(({ id, status }) => ({ id, status }))
    )
  },
  async (original, { container }) => {
    if (!original?.length) {
      return
    }
    const reviewService: ProductReviewModuleService =
      container.resolve(PRODUCT_REVIEW_MODULE)
    await reviewService.updateReviews(original)
  }
)

export const updateReviewStatusWorkflow = createWorkflow(
  "update-review-status",
  (input: UpdateReviewStatusInput) => {
    const reviews = updateReviewStatusStep(input)
    return new WorkflowResponse(reviews)
  }
)
