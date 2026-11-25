import { Metadata } from "next"
import { Suspense } from "react"

import ResetPassword from "@modules/account/components/reset-password"

export const metadata: Metadata = {
  title: "Şifre sıfırlama",
  description: "Coşkun Hırdavat hesabınızın şifresini sıfırlayın.",
}

export default function ResetPasswordPage() {
  return (
    <div className="w-full flex justify-center px-8 py-12">
      <Suspense>
        <ResetPassword />
      </Suspense>
    </div>
  )
}
