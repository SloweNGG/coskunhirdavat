"use server"

import { sdk } from "@lib/config"

export type PasswordResetState =
  | { state: "error"; error: string }
  | { state: "success" }
  | null

/** Asks the backend to email a reset link. Always reports success (no account enumeration). */
export async function requestPasswordReset(
  _: PasswordResetState,
  formData: FormData
): Promise<PasswordResetState> {
  const email = String(formData.get("email") ?? "").trim()
  if (!email) {
    return { state: "error", error: "Lütfen e-posta adresinizi girin." }
  }
  await sdk.auth
    .resetPassword("customer", "emailpass", { identifier: email })
    .catch(() => null)
  return { state: "success" }
}

/** Sets a new password with the token from the reset email. */
export async function updatePasswordWithToken(
  _: PasswordResetState,
  formData: FormData
): Promise<PasswordResetState> {
  const token = String(formData.get("token") ?? "")
  const password = String(formData.get("password") ?? "")
  const confirm = String(formData.get("confirm_password") ?? "")

  if (password.length < 8) {
    return { state: "error", error: "Şifreniz en az 8 karakter olmalıdır." }
  }
  if (password !== confirm) {
    return { state: "error", error: "Şifreler birbiriyle eşleşmiyor." }
  }

  try {
    await sdk.auth.updateProvider("customer", "emailpass", { password }, token)
    return { state: "success" }
  } catch {
    return {
      state: "error",
      error:
        "Bağlantının süresi dolmuş veya geçersiz. Lütfen yeni bir sıfırlama bağlantısı isteyin.",
    }
  }
}
