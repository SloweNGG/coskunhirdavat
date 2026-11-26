import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  ArrowDownMini,
  ArrowUpMini,
  PencilSquare,
  Photo,
  Plus,
  Trash,
} from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Drawer,
  Heading,
  IconButton,
  Input,
  Label,
  Select,
  Switch,
  Table,
  Text,
  Textarea,
  toast,
  usePrompt,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { type ReactNode, useState } from "react"

type Theme = "dark" | "brand" | "light"
type ImageStyle = "card" | "background"

type Slide = {
  id: string
  eyebrow: string | null
  title: string
  accent: string | null
  description: string | null
  button_text: string | null
  button_url: string | null
  secondary_button_text: string | null
  secondary_button_url: string | null
  image_url: string | null
  image_style: ImageStyle
  theme: Theme
  show_stamp: boolean
  duration: number
  is_active: boolean
  rank: number
  starts_at: string | null
  ends_at: string | null
}

type Form = Omit<Slide, "id" | "rank">

const EMPTY: Form = {
  eyebrow: "",
  title: "",
  accent: "",
  description: "",
  button_text: "",
  button_url: "",
  secondary_button_text: "",
  secondary_button_url: "",
  image_url: "",
  image_style: "card",
  theme: "dark",
  show_stamp: false,
  duration: 6,
  is_active: true,
  starts_at: null,
  ends_at: null,
}

const THEMES: { value: Theme; label: string }[] = [
  { value: "dark", label: "Koyu (antrasit)" },
  { value: "brand", label: "Marka rengi" },
  { value: "light", label: "Açık" },
]

// Approximate storefront colours (theme "turkuaz"), for the preview only.
const PREVIEW: Record<Theme, { bg: string; fg: string; accent: string; chip: string; chipFg: string; button: string; buttonFg: string }> = {
  dark: { bg: "#23272b", fg: "#ffffff", accent: "#3bc9db", chip: "#0c8599", chipFg: "#fff", button: "#0c8599", buttonFg: "#fff" },
  brand: { bg: "#0c8599", fg: "#ffffff", accent: "#23272b", chip: "#23272b", chipFg: "#fff", button: "#23272b", buttonFg: "#fff" },
  light: { bg: "#e3fafc", fg: "#23272b", accent: "#0b7285", chip: "#0c8599", chipFg: "#fff", button: "#0c8599", buttonFg: "#fff" },
}

const api = async <T,>(path: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  })
  if (!res.ok) {
    throw new Error((await res.json().catch(() => null))?.message || res.statusText)
  }
  return res.json()
}

/** "2026-12-01T09:30" in local time for <input type="datetime-local">. */
const toLocalInput = (iso: string | null) => {
  if (!iso) return ""
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : null)

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("tr-TR", { dateStyle: "short", timeStyle: "short" })

/** What the storefront shows for the slide right now. */
const statusOf = (slide: Slide): { label: string; color: "green" | "grey" | "orange" | "red" } => {
  if (!slide.is_active) return { label: "Kapalı", color: "grey" }
  const now = Date.now()
  if (slide.starts_at && new Date(slide.starts_at).getTime() > now) {
    return { label: `${formatDate(slide.starts_at)} başlar`, color: "orange" }
  }
  if (slide.ends_at && new Date(slide.ends_at).getTime() <= now) {
    return { label: "Süresi doldu", color: "red" }
  }
  return { label: "Yayında", color: "green" }
}

const uploadImage = async (file: File) => {
  const form = new FormData()
  form.append("files", file)
  const res = await fetch("/admin/uploads", {
    method: "POST",
    credentials: "include",
    body: form,
  })
  if (!res.ok) throw new Error("Görsel yüklenemedi")
  const { files } = await res.json()
  return files[0].url as string
}

const Field = ({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) => (
  <div className="flex flex-col gap-y-1.5">
    <Label size="small" weight="plus">
      {label}
    </Label>
    {children}
    {hint && (
      <Text size="xsmall" className="text-ui-fg-subtle">
        {hint}
      </Text>
    )}
  </div>
)

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="flex flex-col gap-y-4 border-t border-ui-border-base pt-5 first:border-t-0 first:pt-0">
    <Heading level="h3">{title}</Heading>
    {children}
  </div>
)

/** A rough, scaled-down picture of the slide with the store's colours. */
const Preview = ({ form }: { form: Form }) => {
  const c = PREVIEW[form.theme]
  const background = form.image_url && form.image_style === "background"
  return (
    <div
      className="relative flex min-h-[200px] items-center gap-4 overflow-hidden rounded-xl p-5"
      style={{ background: c.bg, color: c.fg }}
    >
      {background && (
        <>
          <img src={form.image_url!} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(90deg, ${c.bg} 0%, ${c.bg}d9 45%, ${c.bg}1a 100%)` }}
          />
        </>
      )}
      <div className="relative flex min-w-0 flex-1 flex-col gap-2">
        {form.eyebrow && (
          <span
            className="w-fit rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest"
            style={{ background: c.chip, color: c.chipFg }}
          >
            {form.eyebrow}
          </span>
        )}
        <div className="text-lg font-bold leading-tight">
          {form.title || "Başlık"}
          {form.accent && <div style={{ color: c.accent }}>{form.accent}</div>}
        </div>
        {form.description && <p className="line-clamp-3 text-xs opacity-85">{form.description}</p>}
        <div className="flex flex-wrap gap-2 pt-1">
          {form.button_text && (
            <span className="rounded-md px-3 py-1.5 text-xs font-semibold" style={{ background: c.button, color: c.buttonFg }}>
              {form.button_text} →
            </span>
          )}
          {form.secondary_button_text && (
            <span className="rounded-md border px-3 py-1.5 text-xs font-semibold" style={{ borderColor: c.fg }}>
              {form.secondary_button_text}
            </span>
          )}
        </div>
      </div>
      {form.image_url && !background && (
        <div className="relative flex h-24 w-24 shrink-0 rotate-3 items-center justify-center rounded-2xl bg-white p-2 shadow-lg">
          <img src={form.image_url} alt="" className="h-full w-full object-contain" />
        </div>
      )}
      {form.show_stamp && (
        <span
          className="absolute right-3 top-3 flex h-12 w-12 -rotate-12 items-center justify-center rounded-full border-2 border-dashed text-[8px] font-mono uppercase"
          style={{ borderColor: c.accent, color: c.accent }}
        >
          Mühür
        </span>
      )}
    </div>
  )
}

const SlideEditor = ({
  slide,
  open,
  onOpenChange,
}: {
  /** null: a new slide. */
  slide: Slide | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) => {
  const queryClient = useQueryClient()
  // Only the editable fields (not id, rank or timestamps).
  const [form, setForm] = useState<Form>(() =>
    slide
      ? (Object.fromEntries(
          Object.keys(EMPTY).map((key) => [key, slide[key as keyof Form] ?? EMPTY[key as keyof Form]])
        ) as Form)
      : EMPTY
  )
  const [uploading, setUploading] = useState(false)
  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const { mutate: save, isPending } = useMutation({
    mutationFn: () =>
      api(slide ? `/admin/hero-slides/${slide.id}` : "/admin/hero-slides", {
        method: "POST",
        body: JSON.stringify(form),
      }),
    onSuccess: () => {
      toast.success(slide ? "Slayt kaydedildi" : "Slayt eklendi", {
        description: "Mağazada en geç 1 dakika içinde görünür.",
      })
      queryClient.invalidateQueries({ queryKey: ["hero-slides"] })
      onOpenChange(false)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const onFile = async (file?: File) => {
    if (!file) return
    setUploading(true)
    try {
      set("image_url", await uploadImage(file))
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setUploading(false)
    }
  }

  const text = (key: keyof Form) => ({
    value: (form[key] as string | null) ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      set(key, e.target.value as never),
  })

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Drawer.Content className="max-w-2xl">
        <Drawer.Header>
          <Drawer.Title>{slide ? "Slaytı düzenle" : "Yeni slayt"}</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="flex flex-col gap-y-6 overflow-y-auto">
          <div className="flex flex-col gap-y-2">
            <Text size="small" weight="plus">
              Önizleme
            </Text>
            <Preview form={form} />
            <Text size="xsmall" className="text-ui-fg-subtle">
              Yaklaşık görünüm; mağazada yazı tipi ve boyutlar daha büyüktür.
            </Text>
          </div>

          <Section title="Yazılar">
            <Field label="Üst etiket" hint="Başlığın üstündeki küçük etiket. Örn. Kesme ve Aşındırma">
              <Input {...text("eyebrow")} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Başlık (1. satır) *">
                <Input {...text("title")} />
              </Field>
              <Field label="Vurgulu satır (2. satır)" hint="Marka renginde gösterilir.">
                <Input {...text("accent")} />
              </Field>
            </div>
            <Field label="Açıklama">
              <Textarea rows={3} {...text("description")} />
            </Field>
          </Section>

          <Section title="Butonlar">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Ana buton yazısı">
                <Input {...text("button_text")} placeholder="Ürünleri gör" />
              </Field>
              <Field label="Ana buton bağlantısı">
                <Input {...text("button_url")} placeholder="/categories/kaynak-malzemeleri" />
              </Field>
              <Field label="İkinci buton yazısı">
                <Input {...text("secondary_button_text")} />
              </Field>
              <Field label="İkinci buton bağlantısı">
                <Input {...text("secondary_button_url")} />
              </Field>
            </div>
            <Text size="xsmall" className="text-ui-fg-subtle">
              Bağlantı örnekleri: /store (tüm ürünler), /categories/kategori-adi, /products/urun-adi,
              #kategoriler (sayfadaki kategoriler) veya https:// ile başlayan tam adres. Yazısı ya da
              bağlantısı boş olan buton gösterilmez.
            </Text>
          </Section>

          <Section title="Görsel">
            <div className="flex items-start gap-4">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-ui-border-base bg-ui-bg-subtle">
                {form.image_url ? (
                  <img src={form.image_url} alt="" className="h-full w-full object-contain" />
                ) : (
                  <Photo className="text-ui-fg-muted" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-3">
                <div className="flex gap-2">
                  <Button size="small" variant="secondary" disabled={uploading} isLoading={uploading} asChild>
                    <label className="cursor-pointer">
                      {form.image_url ? "Değiştir" : "Görsel yükle"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => onFile(e.target.files?.[0])}
                      />
                    </label>
                  </Button>
                  {form.image_url && (
                    <Button size="small" variant="secondary" onClick={() => set("image_url", "")}>
                      Kaldır
                    </Button>
                  )}
                </div>
                <Input {...text("image_url")} placeholder="veya görsel adresi (https://...)" size="small" />
              </div>
            </div>
            <Field
              label="Görsel nasıl gösterilsin?"
              hint="Beyaz zeminli ürün fotoğrafları için beyaz kart, geniş fotoğraflar için arka plan."
            >
              <Select value={form.image_style} onValueChange={(v) => set("image_style", v as ImageStyle)}>
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="card">Beyaz kartta (ürün fotoğrafı)</Select.Item>
                  <Select.Item value="background">Arka planı kaplasın (geniş fotoğraf)</Select.Item>
                </Select.Content>
              </Select>
            </Field>
          </Section>

          <Section title="Görünüm">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Renk teması">
                <Select value={form.theme} onValueChange={(v) => set("theme", v as Theme)}>
                  <Select.Trigger>
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    {THEMES.map((t) => (
                      <Select.Item key={t.value} value={t.value}>
                        {t.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </Field>
              <Field label="Ekranda kalma süresi (saniye)" hint="2 ile 30 arası.">
                <Input
                  type="number"
                  min={2}
                  max={30}
                  value={form.duration}
                  onChange={(e) => set("duration", Number(e.target.value) || 6)}
                />
              </Field>
            </div>
            <div className="flex items-center gap-x-3">
              <Switch id="show_stamp" checked={form.show_stamp} onCheckedChange={(v) => set("show_stamp", v)} />
              <Label htmlFor="show_stamp" size="small">
                Mühür ve çizim etiketini göster (görselsiz slaytlarda en iyi görünür)
              </Label>
            </div>
          </Section>

          <Section title="Yayın">
            <div className="flex items-center gap-x-3">
              <Switch id="is_active" checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} />
              <Label htmlFor="is_active" size="small">
                Mağazada göster
              </Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Başlangıç" hint="Boşsa hemen başlar.">
                <Input
                  type="datetime-local"
                  value={toLocalInput(form.starts_at)}
                  onChange={(e) => set("starts_at", fromLocalInput(e.target.value))}
                />
              </Field>
              <Field label="Bitiş" hint="Boşsa süresiz. Kampanyalar için kullanın.">
                <Input
                  type="datetime-local"
                  value={toLocalInput(form.ends_at)}
                  onChange={(e) => set("ends_at", fromLocalInput(e.target.value))}
                />
              </Field>
            </div>
          </Section>
        </Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close asChild>
            <Button variant="secondary" size="small">
              Vazgeç
            </Button>
          </Drawer.Close>
          <Button size="small" isLoading={isPending} disabled={!form.title.trim() || uploading} onClick={() => save()}>
            Kaydet
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}

const HeroSlidesPage = () => {
  const queryClient = useQueryClient()
  const prompt = usePrompt()
  // undefined: closed; null: new slide.
  const [editing, setEditing] = useState<Slide | null | undefined>(undefined)

  const { data, isLoading } = useQuery({
    queryKey: ["hero-slides"],
    queryFn: () => api<{ hero_slides: Slide[] }>("/admin/hero-slides"),
  })
  const slides = data?.hero_slides ?? []

  const onError = (e: Error) => toast.error(e.message)
  const refresh = () => queryClient.invalidateQueries({ queryKey: ["hero-slides"] })

  const reorder = useMutation({
    mutationFn: (ids: string[]) =>
      api("/admin/hero-slides/reorder", { method: "POST", body: JSON.stringify({ ids }) }),
    onSuccess: refresh,
    onError,
  })

  const toggle = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      api(`/admin/hero-slides/${id}`, { method: "POST", body: JSON.stringify({ is_active }) }),
    onSuccess: refresh,
    onError,
  })

  const remove = useMutation({
    mutationFn: (id: string) => api(`/admin/hero-slides/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Slayt silindi")
      refresh()
    },
    onError,
  })

  const move = (index: number, by: number) => {
    const ids = slides.map((s) => s.id)
    const [id] = ids.splice(index, 1)
    ids.splice(index + by, 0, id)
    reorder.mutate(ids)
  }

  const confirmDelete = async (slide: Slide) => {
    const ok = await prompt({
      title: "Slayt silinsin mi?",
      description: `"${[slide.title, slide.accent].filter(Boolean).join(" ")}" slaytı silinecek.`,
      confirmText: "Sil",
      cancelText: "Vazgeç",
    })
    if (ok) remove.mutate(slide.id)
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-start justify-between gap-4 px-6 py-4">
        <div>
          <Heading level="h1">Ana Sayfa Slaytları</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Ana sayfanın üstündeki kayan bannerlar. İlk sıradaki slayt ilk açılışta görünür; sırayı
            oklarla değiştirin. Değişiklikler mağazada en geç 1 dakikada görünür.
          </Text>
        </div>
        <Button size="small" variant="secondary" onClick={() => setEditing(null)}>
          <Plus />
          Yeni slayt
        </Button>
      </div>

      {isLoading ? (
        <Text className="px-6 py-8 text-ui-fg-subtle">Yükleniyor…</Text>
      ) : slides.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
          <Text weight="plus">Henüz slayt yok</Text>
          <Text size="small" className="text-ui-fg-subtle">
            Slayt yokken ana sayfada mağazanın varsayılan tanıtım bannerı gösterilir.
          </Text>
        </div>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell className="w-24">Sıra</Table.HeaderCell>
              <Table.HeaderCell className="w-20">Görsel</Table.HeaderCell>
              <Table.HeaderCell>Başlık</Table.HeaderCell>
              <Table.HeaderCell>Durum</Table.HeaderCell>
              <Table.HeaderCell>Göster</Table.HeaderCell>
              <Table.HeaderCell className="text-right">İşlemler</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {slides.map((slide, i) => {
              const status = statusOf(slide)
              return (
                <Table.Row key={slide.id}>
                  <Table.Cell>
                    <div className="flex items-center gap-1">
                      <Text size="small" className="w-5 tabular-nums text-ui-fg-subtle">
                        {i + 1}
                      </Text>
                      <IconButton
                        size="small"
                        variant="transparent"
                        disabled={i === 0 || reorder.isPending}
                        onClick={() => move(i, -1)}
                        aria-label="Yukarı taşı"
                      >
                        <ArrowUpMini />
                      </IconButton>
                      <IconButton
                        size="small"
                        variant="transparent"
                        disabled={i === slides.length - 1 || reorder.isPending}
                        onClick={() => move(i, 1)}
                        aria-label="Aşağı taşı"
                      >
                        <ArrowDownMini />
                      </IconButton>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex h-10 w-14 items-center justify-center overflow-hidden rounded border border-ui-border-base bg-ui-bg-subtle">
                      {slide.image_url ? (
                        <img src={slide.image_url} alt="" className="h-full w-full object-contain" />
                      ) : (
                        <Photo className="text-ui-fg-muted" />
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-col py-2">
                      <Text size="small" weight="plus">
                        {[slide.title, slide.accent].filter(Boolean).join(" ")}
                      </Text>
                      {slide.eyebrow && (
                        <Text size="xsmall" className="text-ui-fg-subtle">
                          {slide.eyebrow}
                        </Text>
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge size="2xsmall" color={status.color}>
                      {status.label}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Switch
                      checked={slide.is_active}
                      disabled={toggle.isPending}
                      onCheckedChange={(is_active) => toggle.mutate({ id: slide.id, is_active })}
                      aria-label="Mağazada göster"
                    />
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    <div className="flex justify-end gap-1">
                      <IconButton size="small" variant="transparent" onClick={() => setEditing(slide)} aria-label="Düzenle">
                        <PencilSquare />
                      </IconButton>
                      <IconButton size="small" variant="transparent" onClick={() => confirmDelete(slide)} aria-label="Sil">
                        <Trash />
                      </IconButton>
                    </div>
                  </Table.Cell>
                </Table.Row>
              )
            })}
          </Table.Body>
        </Table>
      )}

      {editing !== undefined && (
        <SlideEditor
          key={editing?.id ?? "new"}
          slide={editing}
          open
          onOpenChange={(open) => {
            if (!open) setEditing(undefined)
          }}
        />
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Ana Sayfa Slaytları",
  icon: Photo,
})

export default HeroSlidesPage
