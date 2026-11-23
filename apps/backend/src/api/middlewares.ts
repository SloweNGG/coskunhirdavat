import {
  authenticate,
  configureStoreSearch,
  defineMiddlewares,
  validateAndTransformBody,
} from '@medusajs/framework/http'
import { StorePaytrToken } from './store/paytr/validators'
import { StoreCreateRestockSubscription } from './store/restock-subscriptions/validators'
import { StoreCreateReview } from './store/reviews/validators'
import { AdminUpdateReviewStatus } from './admin/reviews/status/validators'
import { CreateQuoteSchema, SendQuoteSchema } from './admin/quotes/helpers'
import { sentryErrorHandler } from '../lib/sentry-error-handler'

// The product index declares filterable `status` and `sales_channel_ids`, so
// the route narrows it to published products in the key's sales channels.
export default defineMiddlewares({
  // Reports unexpected errors to Sentry when SENTRY_DSN is set
  errorHandler: sentryErrorHandler,
  routes: [
    {
      method: ['POST'],
      matcher: '/store/search',
      middlewares: [
        configureStoreSearch({
          allowed_indexes: {
            product: true,
          },
        }),
      ],
    },
    {
      method: ['POST'],
      matcher: '/store/paytr/token',
      middlewares: [validateAndTransformBody(StorePaytrToken)],
    },
    {
      method: ['POST'],
      matcher: '/store/restock-subscriptions',
      middlewares: [
        authenticate('customer', ['session', 'bearer'], {
          allowUnauthenticated: true,
        }),
        validateAndTransformBody(StoreCreateRestockSubscription),
      ],
    },
    {
      method: ['POST'],
      matcher: '/store/reviews',
      middlewares: [
        authenticate('customer', ['session', 'bearer']),
        validateAndTransformBody(StoreCreateReview),
      ],
    },
    {
      method: ['POST'],
      matcher: '/admin/reviews/status',
      middlewares: [validateAndTransformBody(AdminUpdateReviewStatus)],
    },
    {
      method: ['POST'],
      matcher: '/store/customers/me/orders/:id/reorder',
      middlewares: [authenticate('customer', ['session', 'bearer'])],
    },
    {
      method: ['POST'],
      matcher: '/store/customers/me/quotes',
      middlewares: [validateAndTransformBody(CreateQuoteSchema)],
    },
    {
      method: ['POST'],
      matcher: '/admin/quotes/:id/send',
      middlewares: [validateAndTransformBody(SendQuoteSchema)],
    },
  ],
})
