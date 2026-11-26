"use client"

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react"
import { ChevronLeft, ChevronRight, XMark } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@modules/common/components/ui"
import Image from "next/image"
import { useEffect, useRef, useState } from "react"

const ZOOM = 2.5
/** Horizontal finger travel (px) that counts as a swipe to the next photo. */
const SWIPE_PX = 50

type Origin = { x: number; y: number }

const clamp = (n: number) => Math.min(100, Math.max(0, n))

/** Where a point falls inside an element, in percent; used as transform-origin. */
export const pointOrigin = (el: Element, clientX: number, clientY: number): Origin => {
  const r = el.getBoundingClientRect()
  return {
    x: clamp(((clientX - r.left) / r.width) * 100),
    y: clamp(((clientY - r.top) / r.height) * 100),
  }
}

type ImageLightboxProps = {
  images: HttpTypes.StoreProductImage[]
  index: number
  open: boolean
  onClose: () => void
  onIndexChange: (index: number) => void
}

/**
 * Full-screen photo viewer. Click or tap zooms in at that point (the zoomed
 * photo follows the mouse or finger), arrows / keys / swipes change photo,
 * Esc or the close button exits.
 */
const ImageLightbox = ({
  images,
  index,
  open,
  onClose,
  onIndexChange,
}: ImageLightboxProps) => {
  const [zoomed, setZoomed] = useState(false)
  const [origin, setOrigin] = useState<Origin>({ x: 50, y: 50 })
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  const count = images.length
  const image = images[index]

  // Arrow keys change photo. Listened for on the window: clicking the photo
  // to zoom can leave focus outside the panel, where its key events never go.
  useEffect(() => {
    if (!open || count < 2) {
      return
    }
    const onKey = (e: KeyboardEvent) => {
      const step = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0
      if (step) {
        setZoomed(false)
        onIndexChange((index + step + count) % count)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, count, index, onIndexChange])

  const go = (step: number) => {
    setZoomed(false)
    onIndexChange((index + step + count) % count)
  }

  const close = () => {
    setZoomed(false)
    onClose()
  }

  if (!image) {
    return null
  }

  return (
    <Dialog open={open} onClose={close} className="relative z-[90]">
      <div className="fixed inset-0 bg-navy" aria-hidden />
      <DialogPanel className="fixed inset-0 flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 text-white small:px-6">
          <DialogTitle className="text-sm font-medium">
            Görsel {index + 1} / {count}
            <span className="ml-3 hidden text-white/60 small:inline">
              {zoomed ? "Küçültmek için tıklayın" : "Yakınlaştırmak için tıklayın"}
            </span>
          </DialogTitle>
          <button
            type="button"
            onClick={close}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
            aria-label="Kapat"
          >
            <XMark />
          </button>
        </div>

        <div className="relative min-h-0 flex-1 px-4 pb-4 small:px-20">
          <div
            className={clx(
              "relative h-full w-full touch-pan-y overflow-hidden rounded-2xl bg-white",
              zoomed ? "cursor-zoom-out touch-none" : "cursor-zoom-in"
            )}
            onClick={(e) => {
              setOrigin(pointOrigin(e.currentTarget, e.clientX, e.clientY))
              setZoomed((z) => !z)
            }}
            onPointerMove={(e) => {
              if (zoomed && e.pointerType === "mouse") {
                setOrigin(pointOrigin(e.currentTarget, e.clientX, e.clientY))
              }
            }}
            onTouchStart={(e) => {
              const t = e.touches[0]
              touchStart.current = { x: t.clientX, y: t.clientY }
            }}
            onTouchMove={(e) => {
              if (zoomed) {
                const t = e.touches[0]
                setOrigin(pointOrigin(e.currentTarget, t.clientX, t.clientY))
              }
            }}
            onTouchEnd={(e) => {
              const start = touchStart.current
              touchStart.current = null
              if (!start || zoomed || count < 2) return
              const t = e.changedTouches[0]
              const dx = t.clientX - start.x
              const dy = t.clientY - start.y
              if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy)) {
                go(dx < 0 ? 1 : -1)
              }
            }}
          >
            {!!image.url && (
              <Image
                key={image.id}
                src={image.url}
                alt={`Ürün görseli ${index + 1}`}
                fill
                sizes="100vw"
                className="select-none object-contain p-4 transition-transform duration-200 ease-out motion-reduce:transition-none small:p-8"
                style={{
                  transform: zoomed ? `scale(${ZOOM})` : undefined,
                  transformOrigin: `${origin.x}% ${origin.y}%`,
                }}
                draggable={false}
              />
            )}
          </div>

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                className="absolute left-6 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-navy shadow-md hover:bg-soft small:left-5"
                aria-label="Önceki görsel"
              >
                <ChevronLeft />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className="absolute right-6 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-navy shadow-md hover:bg-soft small:right-5"
                aria-label="Sonraki görsel"
              >
                <ChevronRight />
              </button>
            </>
          )}
        </div>

        {count > 1 && (
          <ul
            className="flex shrink-0 justify-start gap-2 overflow-x-auto px-4 pb-4 small:justify-center"
            aria-label="Ürün görselleri"
          >
            {images.map((img, i) => (
              <li key={img.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setZoomed(false)
                    onIndexChange(i)
                  }}
                  aria-label={`Görsel ${i + 1}`}
                  aria-current={i === index}
                  className={clx(
                    "relative block h-14 w-14 overflow-hidden rounded-lg border-2 bg-white small:h-16 small:w-16",
                    i === index ? "border-brand-bright" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  {!!img.url && (
                    <Image src={img.url} alt="" fill sizes="64px" className="object-contain p-1" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogPanel>
    </Dialog>
  )
}

export default ImageLightbox
