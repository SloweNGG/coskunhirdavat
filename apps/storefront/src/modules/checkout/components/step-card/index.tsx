import { CheckMini, PencilSquare } from "@medusajs/icons"
import { clx } from "@modules/common/components/ui"

export type StepState = "active" | "done" | "upcoming"

/**
 * One checkout step as a rounded card, like the cart page cards: numbered
 * title (a turquoise check once done), an optional "Düzenle" pill and the
 * body indented under the title. The open step gets a turquoise outline.
 */
const StepCard = ({
  step,
  title,
  state,
  onEdit,
  editTestId,
  children,
}: {
  step: number
  title: string
  state: StepState
  /** shows the "Düzenle" button */
  onEdit?: () => void
  editTestId?: string
  children?: React.ReactNode
}) => (
  <section
    aria-labelledby={`checkout-step-${step}`}
    className={clx(
      "rounded-2xl border bg-white p-5 transition-[border-color,box-shadow] duration-300 small:p-6",
      state === "active" ? "border-brand ring-4 ring-brand/10" : "border-line"
    )}
  >
    <div className="flex items-center justify-between gap-x-4">
      <h2 id={`checkout-step-${step}`} className="flex items-center gap-x-3">
        <span
          className={clx(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
            state === "done" && "bg-brand text-brand-fg",
            state === "active" && "bg-navy text-white",
            state === "upcoming" &&
              "bg-soft text-navy/40 ring-1 ring-inset ring-navy/10"
          )}
          aria-hidden
        >
          {state === "done" ? <CheckMini /> : step}
        </span>
        <span
          className={clx(
            "text-xl font-bold",
            state === "upcoming" ? "text-navy/40" : "text-navy"
          )}
        >
          {title}
        </span>
        {state === "done" && <span className="sr-only">(tamamlandı)</span>}
      </h2>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-9 shrink-0 items-center gap-x-1.5 rounded-full border border-line px-3.5 text-sm font-semibold text-navy transition-colors hover:border-brand hover:bg-brand-50 hover:text-brand-ink"
          data-testid={editTestId}
        >
          <PencilSquare aria-hidden />
          Düzenle<span className="sr-only">: {title}</span>
        </button>
      )}
    </div>
    {/* A body whose only child is hidden (the payment step keeps its closed
        form mounted) must not leave an empty gap under the title. */}
    {children && (
      <div className="mt-5 has-[>.hidden:only-child]:hidden small:pl-11">
        {children}
      </div>
    )}
  </section>
)

/** Label + value block used in the summaries of finished steps. */
export const StepInfo = ({
  label,
  children,
  className,
  "data-testid": dataTestId,
}: {
  label: string
  children: React.ReactNode
  className?: string
  "data-testid"?: string
}) => (
  <div
    className={clx("flex min-w-0 flex-col", className)}
    data-testid={dataTestId}
  >
    <span className="mb-1.5 font-mono text-xs font-medium uppercase tracking-wider text-muted">
      {label}
    </span>
    <div className="break-words text-sm leading-6 text-navy">{children}</div>
  </div>
)

export default StepCard
