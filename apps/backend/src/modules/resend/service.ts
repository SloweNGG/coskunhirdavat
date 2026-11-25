import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils"
import {
  Logger,
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types"
import { Resend } from "resend"

type ResendOptions = {
  api_key: string
  from: string
}

/**
 * Sends emails through Resend. Subject and HTML are rendered by the caller
 * (see src/lib/emails.ts) and passed as `content`, so this provider stays generic.
 */
class ResendNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "notification-resend"
  private client: Resend
  private options: ResendOptions
  private logger: Logger

  constructor({ logger }: { logger: Logger }, options: ResendOptions) {
    super()
    this.client = new Resend(options.api_key)
    this.options = options
    this.logger = logger
  }

  static validateOptions(options: Record<string, unknown>) {
    if (!options.api_key || !options.from) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Resend provider needs `api_key` and `from` options."
      )
    }
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    const { subject, html, text } = notification.content ?? {}
    if (!subject || !html) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Notification "${notification.template}" has no rendered subject/html content.`
      )
    }

    const { data, error } = await this.client.emails.send({
      from: notification.from || this.options.from,
      to: [notification.to],
      subject,
      html,
      text: text ?? undefined,
    })

    if (error || !data) {
      this.logger.error(`Resend send failed: ${error?.message ?? "unknown error"}`)
      // Throwing marks the notification as failed so it can be retried.
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Resend send failed: ${error?.message ?? "unknown error"}`
      )
    }

    return { id: data.id }
  }
}

export default ResendNotificationProviderService
