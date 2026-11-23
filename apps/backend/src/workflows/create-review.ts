import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { PRODUCT_REVIEW_MODULE } from "../modules/product-review"
import ProductReviewModuleService from "../modules/product-review/service"

export type CreateReviewInput = {
  product_id: string
  customer_id: string
  rating: number
  title?: string
  content: string
}

const createReviewStep = createStep(
  "create-review",
  async (input: CreateReviewInput, { container }) => {
    const query = container.resolve("query")
    const reviewService: ProductReviewModuleService =
      container.resolve(PRODUCT_REVIEW_MODULE)

    const {
      data: [customer],
    } = await query.graph({
      entity: "customer",
      fields: ["id", "first_name", "last_name"],
      filters: { id: input.customer_id },
    })
    const {
      data: [product],
    } = await query.graph({
      entity: "product",
      fields: ["id"],
      filters: { id: input.product_id, status: "published" },
    })
    if (!customer || !product) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Ürün bulunamadı")
    }

    // One review per product per customer.
    const existing = await reviewService.listReviews(
      { product_id: input.product_id, customer_id: input.customer_id },
      { take: 1 }
    )
    if (existing.length) {
      throw new MedusaError(
        MedusaError.Types.DUPLICATE_ERROR,
        "Bu ürün için zaten bir değerlendirme yaptınız."
      )
    }

    const review = await reviewService.createReviews({
      ...input,
      title: input.title || null,
      first_name: customer.first_name || "Müşteri",
      last_name: customer.last_name || "",
    })

    return new StepResponse(review, review.id)
  },
  async (id, { container }) => {
    if (!id) {
      return
    }
    const reviewService: ProductReviewModuleService =
      container.resolve(PRODUCT_REVIEW_MODULE)
    await reviewService.deleteReviews(id)
  }
)

export const createReviewWorkflow = createWorkflow(
  "create-review",
  (input: CreateReviewInput) => {
    const review = createReviewStep(input)
    return new WorkflowResponse(review)
  }
)
