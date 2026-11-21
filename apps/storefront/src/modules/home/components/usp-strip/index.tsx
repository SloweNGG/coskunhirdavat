import { USP_ITEMS } from "@lib/store-config"
import StoreIcon from "@modules/common/components/store-icon"

const UspStrip = () => {
  return (
    <section className="border-y border-line bg-soft">
      <ul className="content-container grid grid-cols-2 gap-x-4 gap-y-6 py-8 small:grid-cols-3 medium:grid-cols-6">
        {USP_ITEMS.map((item) => (
          <li key={item.title} className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-navy text-brand-bright">
              <StoreIcon name={item.icon} className="h-6 w-6" />
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-semibold text-navy">{item.title}</span>
              <span className="text-xs leading-snug text-muted">{item.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default UspStrip
