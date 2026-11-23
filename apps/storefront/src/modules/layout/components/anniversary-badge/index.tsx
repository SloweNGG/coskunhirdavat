import { clx } from "@modules/common/components/ui"

const GOLD = "#C29A45"

/**
 * "23 Yıl" mark next to the logo: large gold digits whose "3" is cut
 * by a diagonal line, with the label sitting in the cut.
 */
const AnniversaryBadge = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 92 60"
    role="img"
    aria-label="23. yıl"
    className={clx("h-11 w-auto font-sans", className)}
  >
    <text
      x="0"
      y="52"
      fontSize="60"
      fontWeight="700"
      letterSpacing="-6"
      fill={GOLD}
    >
      23
    </text>
    {/* white cut through the lower right of the 3 */}
    <polygon points="41,62 67,32 92,32 92,62" fill="white" />
    <line x1="39" y1="62" x2="69" y2="27" stroke={GOLD} strokeWidth="1.2" />
    <text
      x="60"
      y="54"
      fontSize="11"
      fontWeight="600"
      letterSpacing="2"
      fill="currentColor"
    >
      YIL
    </text>
  </svg>
)

export default AnniversaryBadge
