import { STORE_INFO } from "@lib/store-config"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { clx } from "@modules/common/components/ui"

/** Path of the "C" mark, 88.55 x 100 units (traced from the owner's logo). */
export const LOGO_MARK_PATH =
  "M47.06 0.09C46.89 0.11 46.16 0.19 45.45 0.27C26.56 2.27 11.46 15.15 8.38 31.89C5.5 47.53 13.09 65.4 25.57 72.39C28.9 74.25 32.07 75.27 32.62 74.66C32.92 74.32 32.71 73.99 30.95 72.09C25.08 65.72 22.33 58.2 22.51 48.97C22.86 31.13 36.04 18.33 52.64 19.69C59.66 20.27 65.15 22.72 72.34 28.5C73.9 29.75 74.33 29.92 75.07 29.57C75.52 29.35 77.19 27.51 80.52 23.54C80.96 23.02 81.7 22.16 82.18 21.62C84.22 19.31 86.93 16.05 87.09 15.72C87.31 15.26 87.32 14.69 87.09 14.26C86.74 13.57 83.79 10.97 81.33 9.18C74.11 3.95 66.65 1.25 56.62 0.25C55.31 0.12 47.88 0 47.06 0.09M1.96 39.38C0.48 41.23 0 51.12 1.05 58.12C4.33 79.93 21.13 96.62 42.48 99.31C45.03 99.63 45.74 99.68 48.67 99.73C64.28 100 76.1 95.32 86.56 84.73C88.55 82.72 88.49 82.4 85.53 79.39C75.8 69.47 75.98 69.65 75.2 69.65C74.62 69.65 74.36 69.82 72.48 71.44C57.41 84.43 40.69 87.81 26.28 80.77C15.72 75.61 7.94 65.25 4.58 51.86C3.92 49.25 3.6 47.42 3.1 43.48C2.59 39.54 2.4 38.83 1.96 39.38"

/** The "C" mark on its own, drawn in the current text colour. */
export const LogoMark = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 88.55 100"
    fill="currentColor"
    aria-hidden
    focusable="false"
    {...props}
  >
    <path fillRule="evenodd" d={LOGO_MARK_PATH} />
  </svg>
)

/** Store logo: white "C" mark on a turquoise tile, store name beside it. */
const Logo = ({ inverted = false }: { inverted?: boolean }) => {
  return (
    <LocalizedClientLink
      href="/"
      className="flex items-center gap-x-2.5 shrink-0"
      data-testid="nav-store-link"
      aria-label={STORE_INFO.name}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand text-brand-fg">
        <LogoMark className="h-[26px] w-auto" />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={clx(
            "text-xl font-bold tracking-tight",
            inverted ? "text-white" : "text-navy"
          )}
        >
          {STORE_INFO.shortName}
        </span>
        <span
          className={clx(
            "text-[11px] font-semibold uppercase tracking-[0.2em]",
            inverted ? "text-brand-bright" : "text-brand-ink"
          )}
        >
          Hırdavat
        </span>
      </span>
    </LocalizedClientLink>
  )
}

export default Logo
