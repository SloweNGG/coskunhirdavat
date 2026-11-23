// Sentry error tracking + OpenTelemetry tracing.
// Enabled only when SENTRY_DSN is set; otherwise `register` is a no-op.
// Docs: https://docs.medusajs.com/learn/debugging-and-testing/instrumentation
// Recipe: https://github.com/medusajs/examples/tree/main/sentry-integration
// (adapted to @sentry/node v11, which ships spans to Sentry's OTLP endpoint
// instead of the old SentrySpanProcessor)
import * as Sentry from "@sentry/node"
import { registerOtel } from "@medusajs/medusa"
import { BatchSpanProcessor } from "@medusajs/framework/opentelemetry/sdk-trace-node"
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http"

export function register() {
  const dsn = process.env.SENTRY_DSN
  if (!dsn) {
    return
  }

  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    // Errors are always reported; this only affects Sentry's own spans.
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    integrations: [Sentry.openTelemetryIntegration()],
  })

  const endpoint = Sentry.getOtlpTracesEndpoint(dsn)
  if (!endpoint) {
    return
  }

  registerOtel({
    serviceName: process.env.SENTRY_SERVICE_NAME || "coskunhirdavat-backend",
    spanProcessors: [new BatchSpanProcessor(new OTLPTraceExporter(endpoint))],
    instrument: {
      http: true,
      workflows: true,
      query: true,
      db: true,
    },
  })
}
