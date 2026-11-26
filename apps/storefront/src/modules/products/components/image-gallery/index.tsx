"use client"

import { ArrowsPointingOut, MagnifyingGlassMini } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import PlaceholderImage from "@modules/common/icons/placeholder-image"
import { clx } from "@modules/common/components/ui"
import Image from "next/image"
import { useRef, useState } from "react"
import ImageLightbox, { pointOrigin } from "./image-lightbox"

/** Magnification of the main photo while the magnifier is on. */
const MAGNIFIER_ZOOM = 2

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const [active, setActive] = useState(0)
  /** Where the magnifier is centred, in percent of the photo; null when off. */
  const [magnifier, setMagnifier] = useState<{ x: number; y: number } | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  /** pointerType of the press that led to the latest click ("" for keyboard). */
  const lastPointer = useRef("")

  const openLightbox = () => {
    setMagnifier(null)
    setLightboxOpen(true)
  }

  const current = images[active] ?? images[0]
  const hasThumbnails = images.length > 1

  // Phones: thumbnails under the photo. From `small` up: a column on its
  // left, as tall as the photo, scrolling when there are more than fit.
  return (
    <div
      className={clx(
        "flex flex-col gap-3",
        hasThumbnails &&
          "small:grid small:grid-cols-[5rem_minmax(0,1fr)] small:gap-4 medium:grid-cols-[6rem_minmax(0,1fr)]"
      )}
    >
      {current?.url ? (
        <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-soft small:order-2">
          {/* Mouse: a click turns the magnifier on (it follows the pointer),
              another click or leaving the photo turns it off. Touch and
              keyboard have no pointer to follow, so they open the viewer. */}
          <button
            type="button"
            onPointerDown={(e) => {
              lastPointer.current = e.pointerType
            }}
            onClick={(e) => {
              const byMouse = lastPointer.current === "mouse"
              lastPointer.current = ""
              if (!byMouse) {
                openLightbox()
                return
              }
              const at = pointOrigin(e.currentTarget, e.clientX, e.clientY)
              setMagnifier((on) => (on ? null : at))
            }}
            onPointerMove={(e) => {
              if (magnifier && e.pointerType === "mouse") {
                setMagnifier(pointOrigin(e.currentTarget, e.clientX, e.clientY))
              }
            }}
            onPointerLeave={() => setMagnifier(null)}
            className={clx(
              "absolute inset-0 block h-full w-full",
              magnifier ? "cursor-zoom-out" : "cursor-zoom-in"
            )}
            aria-label="Görseli büyüt"
            aria-pressed={!!magnifier}
          >
            <Image
              key={current.id}
              src={current.url}
              priority
              alt={`Ürün görseli ${active + 1}`}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-contain p-6 mix-blend-multiply transition-transform duration-200 ease-out motion-reduce:transition-none"
              style={
                magnifier
                  ? {
                      transform: `scale(${MAGNIFIER_ZOOM})`,
                      transformOrigin: `${magnifier.x}% ${magnifier.y}%`,
                    }
                  : undefined
              }
              draggable={false}
            />
          </button>

          <button
            type="button"
            onClick={openLightbox}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-navy shadow-sm transition-colors hover:bg-white hover:text-brand-ink"
            aria-label="Tam ekran görüntüle"
            title="Tam ekran görüntüle"
          >
            <ArrowsPointingOut />
          </button>

          <span
            className={clx(
              "pointer-events-none absolute bottom-4 right-4 flex items-center gap-x-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-navy shadow-sm transition-opacity",
              magnifier && "opacity-0"
            )}
            aria-hidden
          >
            <MagnifyingGlassMini />
            <span className="[@media(hover:none)]:hidden">Büyüteç için tıklayın</span>
            <span className="hidden [@media(hover:none)]:inline">Büyütmek için dokunun</span>
          </span>
        </div>
      ) : (
        <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-soft small:order-2">
          <div className="absolute inset-0 flex items-center justify-center bg-soft">
            <PlaceholderImage size={48} />
          </div>
        </div>
      )}

      {hasThumbnails && (
        // The wrapper takes the photo's height from the grid row; the list
        // fills it absolutely so many thumbnails scroll instead of growing it.
        <div className="small:relative small:order-1">
          <ul
            className="grid grid-cols-5 gap-3 small:absolute small:inset-0 small:flex small:flex-col small:overflow-y-auto small:p-0.5 small:[scrollbar-width:thin]"
            aria-label="Ürün görselleri"
          >
            {images.map((image, index) => (
              <li key={image.id} className="small:shrink-0">
                <button
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={`Görsel ${index + 1}`}
                  aria-current={index === active}
                  className={clx(
                    "relative block aspect-square w-full overflow-hidden rounded-2xl border bg-soft transition-colors",
                    index === active
                      ? "border-brand ring-1 ring-brand"
                      : "border-line hover:border-navy/40"
                  )}
                >
                  {!!image.url && (
                    <Image
                      src={image.url}
                      alt=""
                      fill
                      sizes="96px"
                      className="object-contain p-1.5 mix-blend-multiply"
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ImageLightbox
        images={images}
        index={images[active] ? active : 0}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onIndexChange={setActive}
      />
    </div>
  )
}

export default ImageGallery
