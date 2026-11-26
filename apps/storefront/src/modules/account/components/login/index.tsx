"use client"

import { login } from "@lib/data/customer"
import {
  AUTH_CTA,
  AuthHeading,
  AuthNotice,
} from "@modules/account/components/auth-ui"
import Input from "@modules/common/components/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@modules/common/components/ui"
import { startTransition, useActionState } from "react"

type Props = {
  /** set when the cart has items: offers checking out without an account */
  guestCheckoutHref?: string | null
}

const Login = ({ guestCheckoutHref }: Props) => {
  const [message, formAction, isPending] = useActionState(login, null)

  // Submitting through onSubmit (not <form action>) keeps what the customer
  // typed: React resets uncontrolled fields after a form action, even when
  // the login failed.
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(() => formAction(formData))
  }

  return (
    <div className="flex w-full flex-col" data-testid="login-page">
      <AuthHeading
        eyebrow="Hesabım"
        title="Giriş yapın"
        text="Siparişlerinize, tekliflerinize ve size özel fiyatlara ulaşın."
      />
      <form
        className="flex w-full flex-col gap-y-4 small:gap-y-3"
        onSubmit={handleSubmit}
      >
        {message?.state === "verification_required" && (
          <AuthNotice tone="info" data-testid="login-verification-message">
            <strong>{message.email}</strong> adresine bir doğrulama bağlantısı
            gönderdik. E-posta adresinizi doğrulayıp giriş yapın.
          </AuthNotice>
        )}
        <Input
          id="login-email"
          label="E-posta"
          name="email"
          type="email"
          title="Geçerli bir e-posta adresi girin."
          autoComplete="email"
          required
          data-testid="email-input"
        />
        <Input
          id="login-password"
          label="Şifre"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          data-testid="password-input"
          labelAction={
            <LocalizedClientLink
              href="/account/reset-password"
              className="text-sm font-medium text-brand-ink hover:underline"
            >
              Şifremi unuttum
            </LocalizedClientLink>
          }
        />
        {message?.state === "error" && (
          <AuthNotice tone="error" data-testid="login-error-message">
            {message.error}
          </AuthNotice>
        )}
        <Button
          type="submit"
          isLoading={isPending}
          className={`mt-2 ${AUTH_CTA}`}
          data-testid="sign-in-button"
        >
          Giriş yap
        </Button>
      </form>

      {guestCheckoutHref && (
        <div className="mt-6 flex flex-col gap-y-3">
          <div className="flex items-center gap-x-3 text-xs text-muted">
            <span className="h-px flex-1 bg-line" />
            veya
            <span className="h-px flex-1 bg-line" />
          </div>
          <LocalizedClientLink
            href={guestCheckoutHref}
            className="flex h-12 items-center justify-center rounded-xl border border-line text-[15px] font-semibold text-navy transition-colors hover:border-navy/40"
            data-testid="guest-checkout-link"
          >
            Üye olmadan devam et
          </LocalizedClientLink>
          <p className="text-center text-xs text-muted">
            Siparişinizi üye olmadan da verebilirsiniz.
          </p>
        </div>
      )}
    </div>
  )
}

export default Login
