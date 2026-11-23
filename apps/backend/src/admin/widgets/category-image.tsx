import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminProductCategory, DetailWidgetProps } from "@medusajs/framework/types"
import { Button, Container, Heading, Text, toast } from "@medusajs/ui"
import { useState } from "react"

/**
 * Category image for the storefront home grid. The file is uploaded with the
 * file module (POST /admin/uploads); its URL is stored in metadata.image_url.
 */
const CategoryImageWidget = ({ data }: DetailWidgetProps<AdminProductCategory>) => {
  const [metadata, setMetadata] = useState(data.metadata ?? {})
  const [busy, setBusy] = useState(false)
  const imageUrl = (metadata.image_url as string | undefined) ?? ""

  const saveUrl = async (url: string | null) => {
    // Category metadata is replaced on update, so send the other keys too.
    const { image_url: _old, ...rest } = metadata
    const next = url ? { ...rest, image_url: url } : rest
    const res = await fetch(`/admin/product-categories/${data.id}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metadata: next }),
    })
    if (!res.ok) {
      throw new Error("Kategori güncellenemedi")
    }
    setMetadata(next)
  }

  const run = async (fn: () => Promise<void>, success: string) => {
    setBusy(true)
    try {
      await fn()
      toast.success(success)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const onFile = (file?: File) =>
    file &&
    run(async () => {
      const form = new FormData()
      form.append("files", file)
      const res = await fetch("/admin/uploads", {
        method: "POST",
        credentials: "include",
        body: form,
      })
      if (!res.ok) {
        throw new Error("Görsel yüklenemedi")
      }
      const { files } = await res.json()
      await saveUrl(files[0].url)
    }, "Görsel kaydedildi")

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Kategori görseli</Heading>
      </div>
      <div className="flex flex-col gap-3 px-6 py-4">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={data.name}
            className="h-40 w-full max-w-xs rounded-lg border object-cover"
          />
        ) : (
          <Text size="small" className="text-ui-fg-subtle">
            Görsel yok. Ana sayfada kategori simgesi gösterilir.
          </Text>
        )}
        <div className="flex gap-2">
          <Button size="small" variant="secondary" disabled={busy} asChild>
            <label className="cursor-pointer">
              {imageUrl ? "Değiştir" : "Görsel yükle"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={busy}
                onChange={(e) => onFile(e.target.files?.[0])}
              />
            </label>
          </Button>
          {imageUrl && (
            <Button
              size="small"
              variant="danger"
              disabled={busy}
              onClick={() => run(() => saveUrl(null), "Görsel kaldırıldı")}
            >
              Kaldır
            </Button>
          )}
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product_category.details.after",
})

export default CategoryImageWidget
