"use client"

import {
  requestPasswordReset,
  updatePasswordWithToken,
} from "@lib/data/password-reset"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useSearchParams } from "next/navigation"
import { useActionState } from "react"

const ResetPassword = () => {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const email = searchParams.get("email") ?? ""

  const [requestState, requestAction] = useActionState(requestPasswordReset, null)
  const [updateState, updateAction] = useActionState(updatePasswordWithToken, null)

  return (
    <div
      className="max-w-sm w-full flex flex-col items-center"
      data-testid="reset-password-page"
    >
      <h1 className="text-large-semi uppercase mb-6">Şifre sıfırlama</h1>

      {!token && requestState?.state === "success" && (
        <p className="text-center text-base-regular text-ui-fg-base">
          Bu e-posta adresiyle kayıtlı bir hesap varsa şifre sıfırlama
          bağlantısını gönderdik. Lütfen gelen kutunuzu kontrol edin.
        </p>
      )}

      {!token && requestState?.state !== "success" && (
        <>
          <p className="text-center text-base-regular text-ui-fg-base mb-8">
            Hesabınıza kayıtlı e-posta adresini girin, size şifre sıfırlama
            bağlantısı gönderelim.
          </p>
          <form className="w-full" action={requestAction}>
            <Input
              label="E-posta"
              name="email"
              type="email"
              autoComplete="email"
              required
              defaultValue={email}
            />
            <ErrorMessage
              error={requestState?.state === "error" ? requestState.error : null}
            />
            <SubmitButton className="w-full mt-6">
              Sıfırlama bağlantısı gönder
            </SubmitButton>
          </form>
        </>
      )}

      {token && updateState?.state === "success" && (
        <div className="flex flex-col items-center gap-y-4 text-center">
          <p className="text-base-regular text-ui-fg-base">
            Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.
          </p>
          <LocalizedClientLink href="/account" className="underline">
            Giriş yap
          </LocalizedClientLink>
        </div>
      )}

      {token && updateState?.state !== "success" && (
        <form className="w-full" action={updateAction}>
          <input type="hidden" name="token" value={token} />
          <div className="flex flex-col w-full gap-y-2">
            <Input
              label="Yeni şifre"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
            <Input
              label="Yeni şifre (tekrar)"
              name="confirm_password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>
          <ErrorMessage
            error={updateState?.state === "error" ? updateState.error : null}
          />
          <SubmitButton className="w-full mt-6">Şifremi güncelle</SubmitButton>
        </form>
      )}

      <LocalizedClientLink
        href="/account"
        className="text-small-regular text-ui-fg-base underline mt-6"
      >
        Giriş sayfasına dön
      </LocalizedClientLink>
    </div>
  )
}

export default ResetPassword
