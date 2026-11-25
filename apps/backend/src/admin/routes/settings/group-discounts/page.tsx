import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Button, Container, Heading, Input, Label, Switch, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"

type Group = { id: string; name: string; enabled: boolean; percent: number }

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

const GroupDiscountsPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["group-discounts"],
    queryFn: () => api<{ groups: Group[] }>("/admin/group-discounts"),
  })
  const [groups, setGroups] = useState<Group[]>([])
  useEffect(() => setGroups(data?.groups ?? []), [data])

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      api("/admin/group-discounts", { method: "POST", body: JSON.stringify({ groups }) }),
    onSuccess: () => toast.success("Kaydedildi, fiyatlar güncellendi"),
    onError: (e: Error) => toast.error(e.message),
  })

  const set = (id: string, patch: Partial<Group>) =>
    setGroups((gs) => gs.map((g) => (g.id === id ? { ...g, ...patch } : g)))

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading>Grup indirimleri</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Açık olan gruptaki müşteriler giriş yapınca tüm ürünlerde bu oranda indirimli fiyat
          görür. Fiyat Listeleri'nde elle girilen fiyat daha düşükse o geçerli olur.
        </Text>
      </div>
      {isLoading && <Text className="px-6 py-4">Yükleniyor…</Text>}
      {!isLoading && !groups.length && (
        <Text className="px-6 py-4">Henüz müşteri grubu yok (Müşteriler › Müşteri Grupları).</Text>
      )}
      {groups.map((g) => (
        <div key={g.id} className="flex items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <Switch
              id={`sw-${g.id}`}
              checked={g.enabled}
              onCheckedChange={(enabled) => set(g.id, { enabled })}
            />
            <Label htmlFor={`sw-${g.id}`} weight="plus">
              {g.name}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              max={99}
              step={0.5}
              className="w-24"
              aria-label={`${g.name} indirim oranı`}
              value={g.percent}
              disabled={!g.enabled}
              onChange={(e) => set(g.id, { percent: Number(e.target.value) })}
            />
            <Text>%</Text>
          </div>
        </div>
      ))}
      <div className="flex justify-end px-6 py-4">
        <Button onClick={() => mutate()} isLoading={isPending} disabled={!groups.length}>
          Kaydet
        </Button>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Grup indirimleri" })

export default GroupDiscountsPage
