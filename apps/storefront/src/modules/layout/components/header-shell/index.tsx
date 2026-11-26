"use client"

import { ReactNode, useEffect, useState } from "react"

// How far the page has to scroll before the header's bottom corners round.
const SCROLL_THRESHOLD_PX = 40

/**
 * Sticky wrapper of the site header. The header always stays full width and
 * stuck to the top; once the page scrolls, its bottom corners ease into a
 * rounded shape and a soft shadow replaces the bottom border.
 *
 * The last visible child (the category bar on desktop, the main row on
 * mobile) rounds its own bottom corners with
 * `group-data-[scrolled=true]/header:` classes, since nothing here clips it.
 */
const HeaderShell = ({ children }: { children: ReactNode }) => {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      setScrolled(window.scrollY > SCROLL_THRESHOLD_PX)
    }
    const onScroll = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(update)
      }
    }

    // A reload can land mid-page, so check once on mount too.
    frame = window.requestAnimationFrame(update)
    window.addEventListener("scroll", onScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", onScroll)
      window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div
      data-scrolled={scrolled}
      className="group group/header sticky inset-x-0 top-0 z-50"
    >
      <div className="transition-[border-radius,box-shadow] duration-300 ease-out group-data-[scrolled=true]/header:rounded-b-[40px] group-data-[scrolled=true]/header:shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
        {children}
      </div>
    </div>
  )
}

export default HeaderShell
