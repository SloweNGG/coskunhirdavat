import { Tools } from "@medusajs/icons"
import { clx } from "@modules/common/components/ui"

/** Round rubber-stamp badge with text around the edge. Pass a position class (relative/absolute). */
const Stamp = ({
  text,
  className,
}: {
  text: string
  className?: string
}) => {
  const id = "stamp-circle"

  return (
    <div
      aria-hidden
      className={clx(
        "flex h-32 w-32 items-center justify-center rounded-full border-2 border-dashed border-current",
        className
      )}
    >
      <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full">
        <defs>
          <path
            id={id}
            d="M60,60 m-44,0 a44,44 0 1,1 88,0 a44,44 0 1,1 -88,0"
          />
        </defs>
        <text className="fill-current font-mono text-[10px] font-bold uppercase">
          {/* 2 * PI * 44 = 276: spread the text evenly around the circle */}
          <textPath href={`#${id}`} textLength={274} lengthAdjust="spacing">
            {text}
          </textPath>
        </text>
      </svg>
      <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-current">
        <Tools className="h-6 w-6" />
      </span>
    </div>
  )
}

export default Stamp
