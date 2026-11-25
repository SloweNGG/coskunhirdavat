import { model } from "@medusajs/framework/utils"

const Review = model
  .define("review", {
    id: model.id({ prefix: "rev" }).primaryKey(),
    title: model.text().nullable(),
    content: model.text(),
    rating: model.number(),
    first_name: model.text(),
    last_name: model.text(),
    status: model.enum(["pending", "approved", "rejected"]).default("pending"),
    product_id: model.text().index("IDX_REVIEW_PRODUCT_ID"),
    customer_id: model.text().nullable(),
  })
  .checks([
    {
      name: "review_rating_range",
      expression: (columns) =>
        `${columns.rating} >= 1 AND ${columns.rating} <= 5`,
    },
  ])

export default Review
