"use client"

import { HttpTypes } from "@medusajs/types"
import PlaceholderImage from "@modules/common/icons/placeholder-image"
import { clx } from "@modules/common/components/ui"
import Image from "next/image"
import { useState } from "react"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const [active, setActive] = useState(0)

  const current = images[active] ?? images[0]

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-soft">
        {current?.url ? (
          <Image
            key={current.id}
            src={current.url}
            priority
            alt={`Ürün görseli ${active + 1}`}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-contain p-6 mix-blend-multiply"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-soft">
            <PlaceholderImage size={48} />
          </div>
        )}
      </div>

      {images.length > 1 && (
        <ul className="grid grid-cols-5 gap-3" aria-label="Ürün görselleri">
          {images.map((image, index) => (
            <li key={image.id}>
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
      )}
    </div>
  )
}

export default ImageGallery
