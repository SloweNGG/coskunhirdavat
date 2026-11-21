import {
  ArrowPath,
  Beaker,
  Bolt,
  Camera,
  BuildingStorefront,
  ChatBubbleLeftRight,
  CogSixTooth,
  CreditCard,
  Key,
  LightBulb,
  LockClosedSolid,
  Plug,
  ShieldCheck,
  SquaresPlus,
  Sun,
  Swatch,
  Tools,
  TruckFast,
  Wrench,
} from "@medusajs/icons"
import { clx } from "@modules/common/components/ui"

const ICONS = {
  tools: Tools,
  bolt: Bolt,
  cog: CogSixTooth,
  shield: ShieldCheck,
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
