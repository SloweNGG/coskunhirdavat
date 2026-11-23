import { Metadata } from "next"

import InteractiveLink from "@modules/common/components/interactive-link"

export const metadata: Metadata = {
  title: "Sayfa bulunamadı",
  description: "Aradığınız sayfa bulunamadı.",
}

export default function NotFound() {
  return (
    <div className="flex flex-col gap-4 items-center justify-center min-h-[calc(100vh-64px)]">
      <h1 className="text-2xl-semi text-ui-fg-base">Sayfa bulunamadı</h1>
      <p className="text-small-regular text-ui-fg-base">
        Aradığınız sayfa mevcut değil veya taşınmış olabilir.
      </p>
      <InteractiveLink href="/">Ana sayfaya dön</InteractiveLink>
    </div>
  )
}
