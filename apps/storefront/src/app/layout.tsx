import { getBaseURL } from "@lib/util/env"
import { STORE_THEME } from "@lib/store-config"
import { Metadata } from "next"
import { Barlow, Instrument_Sans, JetBrains_Mono } from "next/font/google"
import "styles/globals.css"

// Main font. Variable font: one file per subset covers weights 400-700, so no
// weight list (a list would split it into one file per weight). latin-ext
// holds ğ, ş and İ. Preloaded: it draws the first screen.
const instrumentSans = Instrument_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-instrument-sans",
  display: "swap",
  preload: true,
})

// Prices only (PriceText): digits, ".", "," and "TL", so latin is enough.
// 600 = regular prices, 700 = card/list prices, 800 = product page main price.
// next/font preloads every weight of a family, so all three are preloaded.
const barlow = Barlow({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-barlow",
  display: "swap",
  preload: true,
})

// Small uppercase labels, product codes and IBANs. Not preloaded.
const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  preload: false,
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
