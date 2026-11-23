import InteractiveLink from "@modules/common/components/interactive-link"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "404",
  description: "Bir sorun oluştu",
}

export default async function NotFound() {
  return (
    <div className="flex flex-col gap-4 items-center justify-center min-h-[calc(100vh-64px)]">
      <h1 className="text-2xl-semi text-ui-fg-base">Sayfa bulunamadı</h1>
      <p className="text-small-regular text-ui-fg-base">
        Ulaşmaya çalıştığınız sayfa bulunamadı.
      </p>
      <InteractiveLink href="/">Ana sayfaya dön</InteractiveLink>
    </div>
  )
}
