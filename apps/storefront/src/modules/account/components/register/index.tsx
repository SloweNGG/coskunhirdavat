"use client"

import { startTransition, useActionState, useState } from "react"

import { signup } from "@lib/data/customer"
import { STORE_INFO } from "@lib/store-config"
import {
  AUTH_CTA,
  AuthHeading,
  AuthNotice,
  MIN_PASSWORD_LENGTH,
  PasswordStrength,
} from "@modules/account/components/auth-ui"
import PhoneInput from "@modules/checkout/components/shipping-address/phone-input"
import Input from "@modules/common/components/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@modules/common/components/ui"

const Register = () => {
  const [message, formAction, isPending] = useActionState(signup, null)
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")

  // onSubmit instead of <form action> so a failed attempt keeps the fields
  // filled in (React resets uncontrolled fields after a form action).
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(() => formAction(formData))
  }

  return (
    <div className="flex w-full flex-col" data-testid="register-page">
      <AuthHeading
        eyebrow="Yeni hesap"
        title="Üye olun"
        text="Bir dakikada hesabınızı oluşturun, size özel fiyatları görün."
      />
      <form
        className="flex w-full flex-col gap-y-4 small:gap-y-3"
        onSubmit={handleSubmit}
      >
        {message?.state === "verification_required" && (
          <AuthNotice tone="info" data-testid="register-verification-message">
            <strong>{message.email}</strong> adresine bir doğrulama bağlantısı
            gönderdik. Gelen kutunuzu kontrol edip e-posta adresinizi
            doğruladıktan sonra giriş yapın.
          </AuthNotice>
        )}
        <div className="grid grid-cols-1 gap-4 xsmall:grid-cols-2 small:gap-3">
          <Input
            id="register-first-name"
            label="Ad"
            name="first_name"
            required
            autoComplete="given-name"
            data-testid="first-name-input"
          />
          <Input
            id="register-last-name"
            label="Soyad"
            name="last_name"
            required
            autoComplete="family-name"
            data-testid="last-name-input"
          />
        </div>
        {/* side by side on wide screens (each column is ~240px there, enough
            for the +90 phone field); stacked below that */}
        <div className="grid grid-cols-1 gap-4 medium:grid-cols-2 medium:gap-3">
          <Input
            id="register-email"
            label="E-posta"
            name="email"
            type="email"
            title="Geçerli bir e-posta adresi girin."
            required
            autoComplete="email"
            data-testid="email-input"
          />
          <PhoneInput
            name="phone"
            value={phone}
            onChange={setPhone}
            optional
            data-testid="phone-input"
          />
        </div>
        <div className="flex flex-col gap-y-2">
          <Input
            id="register-password"
            label="Şifre"
            name="password"
            type="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            title={`Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalı.`}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-testid="password-input"
          />
          <PasswordStrength password={password} />
        </div>
        {message?.state === "error" && (
          <AuthNotice tone="error" data-testid="register-error">
            {message.error}
          </AuthNotice>
        )}
        <p className="text-xs leading-relaxed text-muted">
          Hesap oluşturarak {STORE_INFO.name}{" "}
          <LocalizedClientLink
            href="/terms"
            className="font-medium text-navy underline underline-offset-2"
          >
            Kullanım Koşulları
          </LocalizedClientLink>
          &apos;nı ve{" "}
          <LocalizedClientLink
            href="/privacy"
            className="font-medium text-navy underline underline-offset-2"
          >
            Gizlilik Politikası
          </LocalizedClientLink>
          &apos;nı kabul etmiş olursunuz.
        </p>
        <Button
          type="submit"
          isLoading={isPending}
          className={AUTH_CTA}
          data-testid="register-button"
        >
          Üye ol
        </Button>
      </form>
    </div>
  )
}

export default Register
