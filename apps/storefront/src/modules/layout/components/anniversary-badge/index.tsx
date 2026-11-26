import { clx } from "@modules/common/components/ui"

const GOLD = "#C29A45"
const SPARK = "#F7C948"

// The badge renders once (header), so fixed ids are safe.
const DIGITS_CLIP = "anniversary-digits"
const SHINE_GRADIENT = "anniversary-shine"

// "23" as drawn and as the clip for the light sweep; both must match.
const DIGITS = {
  x: 0,
  y: 52,
  fontSize: 60,
  fontWeight: 700,
  letterSpacing: -6,
} as const

/** Four-pointed sparkle around 0,0, 10 units across. */
const SPARKLE_PATH =
  "M0 -5C0.7 -0.7 0.7 -0.7 5 0C0.7 0.7 0.7 0.7 0 5C-0.7 0.7 -0.7 0.7 -5 0C-0.7 -0.7 -0.7 -0.7 0 -5Z"

/** Where the sparkles sit and when they pop: just as the light passes them. */
const SPARKLES = [
  { x: 14, y: 8, scale: 1.3, delay: "0.15s" },
  { x: 3, y: 47, scale: 0.9, delay: "0.2s" },
  { x: 58, y: 7, scale: 1.8, delay: "0.55s" },
]

/**
 * "23 Yıl" mark next to the logo: large gold digits whose "3" is cut
 * by a diagonal line, with the label sitting in the cut. Every 5 s a band
 * of light sweeps over the digits and small yellow sparkles twinkle; with
 * reduced motion turned on, only the still badge shows.
 */
const AnniversaryBadge = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 92 60"
    role="img"
    aria-label="23. yıl"
    className={clx("h-11 w-auto overflow-visible font-sans", className)}
  >
    <defs>
      <clipPath id={DIGITS_CLIP}>
        <text {...DIGITS}>23</text>
      </clipPath>
      <linearGradient id={SHINE_GRADIENT} x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor="#FFE58A" stopOpacity="0" />
        <stop offset="0.35" stopColor="#FFE58A" stopOpacity="0.7" />
        <stop offset="0.5" stopColor="#FFFDF2" stopOpacity="1" />
        <stop offset="0.65" stopColor="#FFE58A" stopOpacity="0.7" />
        <stop offset="1" stopColor="#FFE58A" stopOpacity="0" />
      </linearGradient>
    </defs>

    <text {...DIGITS} fill={GOLD}>
      23
    </text>

    {/* light sweep, clipped to the digits */}
    <g clipPath={`url(#${DIGITS_CLIP})`} className="motion-reduce:hidden">
      <g transform="skewX(-20)">
        <rect
          x="-26"
          y="-10"
          width="26"
          height="80"
          fill={`url(#${SHINE_GRADIENT})`}
          className="animate-gold-shine"
        />
      </g>
    </g>

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

    {SPARKLES.map((s) => (
      <g
        key={`${s.x}-${s.y}`}
        transform={`translate(${s.x} ${s.y}) scale(${s.scale})`}
        className="motion-reduce:hidden"
      >
        <g
          className="animate-gold-twinkle opacity-0 [transform-box:fill-box] [transform-origin:center]"
          style={{ animationDelay: s.delay }}
        >
          <path d={SPARKLE_PATH} fill={SPARK} />
          {/* white glint in the middle */}
          <path d={SPARKLE_PATH} fill="#FFFDF2" transform="scale(0.45)" />
        </g>
      </g>
    ))}
  </svg>
)

export default AnniversaryBadge
