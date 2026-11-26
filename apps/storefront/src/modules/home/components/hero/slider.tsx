"use client"

import { type ReactNode, useRef, useState, useSyncExternalStore } from "react"

// A touch drag this far (px) moves to the next or previous slide.
const SWIPE_DISTANCE = 60

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)"
const subscribeReducedMotion = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED_MOTION)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

/** The visitor's reduced-motion setting; false while rendering on the server. */
const usePrefersReducedMotion = () =>
  useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false
  )

/**
 * The home hero's slider. Slides move sideways; small round dots sit in the
 * bottom-right corner. An invisible `hero-progress` animation (globals.css)
 * inside the active dot times each slide and moves on when it ends, so pausing
 * (pointer over the slider, keyboard focus inside it, a touch drag) simply
 * pauses that animation. Dots, the arrow keys and touch swipes change slides.
 * Visitors who prefer reduced motion get no autoplay and no sliding animation.
 * Hidden slides are inert, so Tab skips their links.
 */
const HeroSlider = ({
  slides,
  labels,
  durations,
  cornerBlocks = [],
}: {
  slides: ReactNode[]
  /** Short name per slide, for the dots and screen readers. */
  labels: string[]
  /** Seconds each slide stays before the next one. */
  durations: number[]
  /**
   * Per slide: true when its bottom-right corner holds the stamp's title
   * block (large screens); the dots move up above it on that slide.
   */
  cornerBlocks?: boolean[]
}) => {
  const count = slides.length
  const [index, setIndex] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [dragX, setDragX] = useState(0)
  const reducedMotion = usePrefersReducedMotion()
  const drag = useRef<{ x: number; y: number; active: boolean } | null>(null)
  const suppressClick = useRef(false)

  const go = (next: number) => setIndex(((next % count) + count) % count)
  const autoplay = !reducedMotion && count > 1
  const paused = hovered || focused || dragX !== 0

  if (count === 0) return null

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Öne çıkanlar"
      className="relative h-full overflow-hidden rounded-xl bg-navy text-white"
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setHovered(true)
      }}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setFocused(false)
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") go(index - 1)
        else if (event.key === "ArrowRight") go(index + 1)
      }}
    >
      {/* Swipe on touch screens; the mouse uses the arrows and dots. */}
      <div
        className="h-full touch-pan-y"
        onPointerDown={(event) => {
          if (event.pointerType === "mouse") return
          drag.current = { x: event.clientX, y: event.clientY, active: false }
        }}
        onPointerMove={(event) => {
          const start = drag.current
          if (!start) return
          const dx = event.clientX - start.x
          const dy = event.clientY - start.y
          if (
            !start.active &&
            Math.abs(dx) > 8 &&
            Math.abs(dx) > Math.abs(dy)
          ) {
            start.active = true
          }
          if (start.active) setDragX(dx)
        }}
        onPointerUp={() => {
          if (drag.current?.active) {
            suppressClick.current = true
            if (dragX <= -SWIPE_DISTANCE) go(index + 1)
            else if (dragX >= SWIPE_DISTANCE) go(index - 1)
          }
          drag.current = null
          setDragX(0)
        }}
        onPointerCancel={() => {
          drag.current = null
          setDragX(0)
        }}
        onClickCapture={(event) => {
          // A swipe that ends on a link is not a tap on it.
          if (suppressClick.current) {
            suppressClick.current = false
            event.preventDefault()
            event.stopPropagation()
          }
        }}
      >
        <div
          aria-live={autoplay && !paused ? "off" : "polite"}
          className={`flex h-full ${
            dragX !== 0 || reducedMotion
              ? ""
              : "transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          }`}
          style={{
            transform: `translateX(calc(${-index * 100}% + ${dragX}px))`,
          }}
        >
          {slides.map((slide, i) => (
            <div
              key={i}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${count}: ${labels[i] ?? ""}`}
              inert={i !== index}
              className="relative w-full shrink-0"
            >
              {slide}
            </div>
          ))}
        </div>
      </div>

      {count > 1 && (
        <div
          className={`absolute bottom-3 right-3 z-10 flex items-center transition-[bottom] duration-500 small:bottom-5 small:right-5 ${
            cornerBlocks[index] ? "medium:bottom-[68px]" : ""
          }`}
        >
          {labels.map((label, i) => {
            const active = i === index
            return (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={`${i + 1}. slayt: ${label}`}
                aria-current={active ? "true" : undefined}
                className="group flex h-6 w-5 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <span
                  className={`relative block h-2 w-2 rounded-full shadow-[0_0_3px_rgba(0,0,0,0.35)] transition-colors duration-300 ${
                    active ? "bg-white" : "bg-white/40 group-hover:bg-white/70"
                  }`}
                >
                  {/* invisible timer: the slide changes when it ends */}
                  {active && autoplay && (
                    <span
                      key={index}
                      aria-hidden
                      className="absolute inset-0 opacity-0"
                      style={{
                        animation: `hero-progress ${
                          durations[index] || 6
                        }s linear forwards`,
                        animationPlayState: paused ? "paused" : "running",
                      }}
                      onAnimationEnd={() => go(index + 1)}
                    />
                  )}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default HeroSlider
