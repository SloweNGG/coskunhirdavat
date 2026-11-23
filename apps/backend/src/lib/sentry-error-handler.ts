import * as Sentry from "@sentry/node"
import {
  errorHandler,
  type MedusaNextFunction,
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

const defaultHandler = errorHandler()

// Server-side MedusaError types worth reporting; client errors (not found,
// invalid data, unauthorized...) are expected and stay out of Sentry.
const REPORTED_TYPES: string[] = [
  MedusaError.Types.UNEXPECTED_STATE,
  MedusaError.Types.DB_ERROR,
]

/** Reports unexpected API errors to Sentry, then uses Medusa's default handler. */
export function sentryErrorHandler(
  error: any,
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  // No-op unless instrumentation.ts initialised Sentry (SENTRY_DSN set).
  if (
    Sentry.isInitialized() &&
    (!MedusaError.isMedusaError(error) || REPORTED_TYPES.includes(error.type))
  ) {
    Sentry.captureException(error)
  }
  return defaultHandler(error, req, res, next)
}
