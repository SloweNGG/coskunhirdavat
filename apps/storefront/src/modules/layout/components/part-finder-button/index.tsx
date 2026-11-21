import { Camera } from "@medusajs/icons"
import { PART_FINDER_MESSAGE, whatsappLink } from "@lib/store-config"

/** Floating "find my part" button shown on every page. */
const PartFinderButton = () => {
  return (
    <a
      href={whatsappLink(PART_FINDER_MESSAGE)}
      target="_blank"
      rel="noreferrer"
      aria-label="Parçanın fotoğrafını WhatsApp'tan gönderin"
      className="group fixed bottom-5 right-5 z-40 flex items-center gap-x-2 rounded-full bg-navy py-2 pl-2 pr-4 text-white shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-transform hover:-translate-y-0.5"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-brand-fg">
        <Camera className="h-5 w-5" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-semibold">Parça Bul</span>
        <span className="hidden text-[11px] text-white/70 xsmall:block">
          Fotoğrafını gönderin
        </span>
      </span>
    </a>
  )
}

export default PartFinderButton
