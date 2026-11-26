import {
  ArrowPath,
  DocumentText,
  EnvelopeSolid,
  ExclamationCircleSolid,
  Heart,
  Tag,
} from "@medusajs/icons"
import { clx } from "@modules/common/components/ui"

/** Full-width turquoise submit button on the sign-in and register forms. */
export const AUTH_CTA =
  "w-full !h-12 !rounded-xl !text-[15px] !font-semibold !shadow-none"

/** Why an account is worth it; shown in the sliding panel and on phones. */
export const MEMBER_BENEFITS = [
  { Icon: Tag, text: "Usta ve bayilere özel fiyatlar" },
  { Icon: DocumentText, text: "Toplu alımda fiyat teklifi isteyin" },
  { Icon: ArrowPath, text: "Siparişlerinizi takip edin, tek tıkla tekrarlayın" },
  { Icon: Heart, text: "Favorilerinizi ve adreslerinizi kaydedin" },
]

/** Mono eyebrow, title and one line of text above an auth form. */
export const AuthHeading = ({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string
  title: string
  text: string
}) => (
  <div className="mb-6 flex flex-col gap-1 small:mb-5">
    <span className="font-mono text-xs font-medium uppercase tracking-widest text-brand-ink">
      {eyebrow}
    </span>
    {/* focused when the view switches, so keyboard and screen reader users land here */}
    <h1
      tabIndex={-1}
      className="text-[26px] font-bold leading-tight text-navy outline-none"
    >
      {title}
    </h1>
    <p className="text-[15px] text-muted">{text}</p>
  </div>
)

/** Red error box or turquoise "check your inbox" box. */
export const AuthNotice = ({
  tone,
  children,
  "data-testid": dataTestId,
}: {
  tone: "error" | "info"
  children: React.ReactNode
  "data-testid"?: string
}) => (
  <div
    role={tone === "error" ? "alert" : "status"}
    data-testid={dataTestId}
    className={clx(
      "flex items-start gap-x-3 rounded-xl border px-4 py-3 text-sm leading-relaxed",
      tone === "error"
        ? "border-rose-200 bg-rose-50 text-rose-800"
        : "border-brand/25 bg-brand-50 text-navy"
    )}
  >
    {tone === "error" ? (
      <ExclamationCircleSolid className="mt-0.5 shrink-0 text-rose-600" />
    ) : (
      <EnvelopeSolid className="mt-0.5 shrink-0 text-brand-ink" />
    )}
    <div>{children}</div>
  </div>
)

const STRENGTH = [
  { label: "Zayıf", bar: "bg-rose-500", text: "text-rose-700" },
  { label: "Orta", bar: "bg-amber-500", text: "text-amber-700" },
  { label: "İyi", bar: "bg-brand", text: "text-brand-ink" },
  { label: "Güçlü", bar: "bg-emerald-600", text: "text-emerald-700" },
]

export const MIN_PASSWORD_LENGTH = 8

/** 0 = weak ... 3 = strong. Anything shorter than the minimum is weak. */
export const passwordStrength = (password: string) => {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return 0
  }

  const points =
    1 +
    Number(/[a-zçğıöşü]/.test(password) && /[A-ZÇĞİÖŞÜ]/.test(password)) +
    Number(/\d/.test(password)) +
    Number(/[^A-Za-z0-9çğıöşüÇĞİÖŞÜ]/.test(password) || password.length >= 12)

  return Math.max(0, Math.min(3, points - 1))
}

/**
 * One line: the minimum-length hint, and once typing starts a four-segment
 * strength bar at the right (the line keeps its height, so nothing jumps).
 */
export const PasswordStrength = ({ password }: { password: string }) => {
  const level = passwordStrength(password)
  const current = STRENGTH[level]

  return (
    <div
      aria-live="polite"
      className="flex min-h-[18px] flex-wrap items-center justify-between gap-x-4 gap-y-1"
    >
      <p className="text-xs text-muted">
        En az {MIN_PASSWORD_LENGTH} karakter; harf ve rakam karıştırın.
      </p>
      {password && (
        <div className="flex items-center gap-x-2">
          <div className="grid w-20 grid-cols-4 gap-x-1" aria-hidden>
            {STRENGTH.map((step, i) => (
              <span
                key={step.label}
                className={clx(
                  "h-1 rounded-full transition-colors",
                  i <= level ? current.bar : "bg-line"
                )}
              />
            ))}
          </div>
          <span className={clx("text-xs font-semibold", current.text)}>
            {current.label}
          </span>
        </div>
      )}
    </div>
  )
}
