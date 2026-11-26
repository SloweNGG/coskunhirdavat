import { getBaseURL } from "@lib/util/env"
import { STORE_THEME } from "@lib/store-config"
import { Metadata } from "next"
import { Barlow, Instrument_Sans, JetBrains_Mono } from "next/font/google"
import "styles/globals.css"

const instrumentSans = Instrument_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-instrument-sans",
  display: "swap",
})

// Prices only (PriceText): sturdy DIN-like figures that read well bold.
const barlow = Barlow({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-barlow",
  display: "swap",
})

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-jetbrains-mono",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html
      lang="tr"
      data-mode="light"
      data-theme={STORE_THEME}
      className={`${instrumentSans.variable} ${jetBrainsMono.variable} ${barlow.variable}`}
    >
      <head>
        <link rel="ucp" href="/.well-known/ucp" />
      </head>
      <body className="font-sans bg-white text-navy antialiased">
        <main className="relative">{props.children}</main>
      </body>
    </html>
  )
}
