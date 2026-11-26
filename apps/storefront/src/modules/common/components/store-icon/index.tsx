import {
  ArchiveBox,
  ArrowPath,
  ArrowsPointingOut,
  Beaker,
  Bolt,
  Camera,
  BuildingStorefront,
  ChatBubbleLeftRight,
  CogSixTooth,
  CreditCard,
  Fire,
  HandTruck,
  Key,
  LightBulb,
  LockClosedSolid,
  Plug,
  Sparkles,
  SquaresPlus,
  Sun,
  Swatch,
  Tools,
  TruckFast,
  Wrench,
} from "@medusajs/icons"
import { clx } from "@modules/common/components/ui"

/** Outline shield-check in the same 15px / 1.5 stroke style as @medusajs/icons (the library only has a filled one). */
const ShieldCheckOutline = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={15}
    height={15}
    viewBox="0 0 15 15"
    fill="none"
    {...props}
  >
    <g
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
    >
      <path d="M7.5 1.25 2.5 3.06v3.86c0 3.06 2.13 5.36 5 6.33 2.87-.97 5-3.27 5-6.33V3.06z" />
      <path d="m5.42 7.33 1.45 1.45 2.71-2.85" />
    </g>
  </svg>
)

const ICONS = {
  tools: Tools,
  bolt: Bolt,
  cog: CogSixTooth,
  shield: ShieldCheckOutline,
  beaker: Beaker,
  light: LightBulb,
  wrench: Wrench,
  sun: Sun,
  truck: TruckFast,
  card: CreditCard,
  lock: LockClosedSolid,
  refresh: ArrowPath,
  chat: ChatBubbleLeftRight,
  building: BuildingStorefront,
  camera: Camera,
  key: Key,
  plug: Plug,
  swatch: Swatch,
  measure: ArrowsPointingOut,
  fire: Fire,
  sparkles: Sparkles,
  handTruck: HandTruck,
  box: ArchiveBox,
  default: SquaresPlus,
} as const

type StoreIconProps = {
  name?: string
  className?: string
}

const StoreIcon = ({ name, className }: StoreIconProps) => {
  const Icon = ICONS[(name ?? "default") as keyof typeof ICONS] ?? ICONS.default

  return <Icon className={clx("shrink-0", className)} aria-hidden />
}

export default StoreIcon
