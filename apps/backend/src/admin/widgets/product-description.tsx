import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { CheckMini, ChevronDownMini } from "@medusajs/icons";
import type {
  AdminProduct,
  DetailWidgetProps,
} from "@medusajs/framework/types";
import {
  Button,
  Container,
  FocusModal,
  Heading,
  Text,
  Textarea,
  clx,
  toast,
} from "@medusajs/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import {
  DescriptionBlock,
  DescriptionRow,
  parseDescription,
  splitDescription,
} from "../../lib/product-description";

/**
 * Product description editor with a live preview of how the store shows it.
 * The text is saved to the normal `description` field; the store turns it
 * into headings, lists, a spec table and Q&A with the same parser
 * (src/lib/product-description.ts, copied to the storefront).
 */

const TEMPLATE = `Ürünün kısa tanıtımı: ne işe yarar, kimler için uygundur.

Öne Çıkan Özellikler:
• Dayanıklı gövde: uzun ömürlü kullanım sağlar
• Kolay kullanım: kurulum gerektirmez

Teknik Özellikler:
Marka: YSB
Ölçü: 50 cm
Ağırlık: 2 kg

Kullanım Alanları:
• Atölye
• Depo

Sık Sorulan Sorular:
Kutudan neler çıkar?
Ürün, taşıma çantası ile birlikte gönderilir.`;

type Snippet = { before: string; select: string; after?: string };

const SNIPPETS: {
  label: string;
  hint: string;
  snippet: Snippet;
  lines?: true;
}[] = [
  {
    label: "Başlık",
    hint: "Sonu iki nokta ile biten satır",
    snippet: { before: "\n\n", select: "Başlık", after: ":\n" },
  },
  {
    label: "Madde",
    hint: "• ile başlayan satır. Seçili satırları maddeye çevirir.",
    snippet: { before: "\n• ", select: "Madde" },
    lines: true,
  },
  {
    label: "Kalın başlıklı madde",
    hint: "• Başlık: açıklama",
    snippet: { before: "\n• ", select: "Başlık", after: ": açıklama" },
  },
  {
    label: "Teknik özellik",
    hint: "Etiket: değer (sağdaki tabloya gider)",
    snippet: { before: "\n", select: "Özellik", after: ": değer" },
  },
  {
    label: "Soru-Cevap",
    hint: "Soru satırı, hemen altında cevabı",
    snippet: { before: "\n\n", select: "Soru", after: "?\nCevap." },
  },
];

const ProductDescriptionWidget = ({
  data,
}: DetailWidgetProps<AdminProduct>) => {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(data.description ?? "");
  const [draft, setDraft] = useState(saved);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  const savedBlocks = useMemo(() => parseDescription(saved), [saved]);
  const draftBlocks = useMemo(() => parseDescription(draft), [draft]);
  const dirty = draft !== saved;

  const openEditor = () => {
    setDraft(saved);
    setOpen(true);
  };

  const close = (next: boolean) => {
    if (
      !next &&
      dirty &&
      !window.confirm("Kaydedilmemiş değişiklikler silinsin mi?")
    ) {
      return;
    }
    setOpen(next);
  };

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/admin/products/${data.id}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: draft.trim() }),
      });
      if (!res.ok) {
        throw new Error("Açıklama kaydedilemedi");
      }
      setSaved(draft.trim());
      setDraft(draft.trim());
      setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Açıklama kaydedildi", {
        description: "Mağazada en geç 1 dakika içinde görünür.",
      });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const insert = ({ snippet, lines }: (typeof SNIPPETS)[number]) => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const { selectionStart: start, selectionEnd: end, value } = el;

    // Turn the selected lines into bullets
    if (lines && end > start) {
      const from = value.lastIndexOf("\n", start - 1) + 1;
      const toNl = value.indexOf("\n", end);
      const to = toNl === -1 ? value.length : toNl;
      const replaced = value
        .slice(from, to)
        .split("\n")
        .map((l) =>
          l.trim() ? `• ${l.replace(/^\s*(?:[•\-*–]\s+)?/, "")}` : l,
        )
        .join("\n");
      const next = value.slice(0, from) + replaced + value.slice(to);
      setDraft(next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(from, from + replaced.length);
      });
      return;
    }

    // Insert after the current line
    const nl = value.indexOf("\n", end);
    const at = nl === -1 ? value.length : nl;
    const before = at === 0 ? "" : snippet.before;
    const text = before + snippet.select + (snippet.after ?? "");
    const next = value.slice(0, at) + text + value.slice(at);
    setDraft(next);
    requestAnimationFrame(() => {
      el.focus();
      const s = at + before.length;
      el.setSelectionRange(s, s + snippet.select.length);
    });
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between gap-4 px-6 py-4">
        <div>
          <Heading level="h2">Ürün açıklaması</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Mağazadaki "Ürün Özellikleri" sekmesinde böyle görünür
          </Text>
        </div>
        <Button size="small" variant="secondary" onClick={openEditor}>
          Düzenle
        </Button>
      </div>

      <div className="relative px-6 py-4">
        {savedBlocks.length ? (
          <>
            <div className={clx(!expanded && "max-h-80 overflow-hidden")}>
              <Preview blocks={savedBlocks} />
            </div>
            {!expanded && (
              <div className="pointer-events-none absolute inset-x-0 bottom-12 h-16 bg-gradient-to-t from-ui-bg-base" />
            )}
            <Button
              size="small"
              variant="transparent"
              className="mt-2"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "Daralt" : "Tamamını göster"}
            </Button>
          </>
        ) : (
          <Text size="small" className="text-ui-fg-subtle">
            Açıklama yok. "Düzenle" ile ekleyebilirsiniz.
          </Text>
        )}
      </div>

      <FocusModal open={open} onOpenChange={close}>
        <FocusModal.Content>
          <FocusModal.Header>
            <div className="flex w-full items-center justify-end gap-2">
              <Button
                size="small"
                variant="secondary"
                onClick={() => close(false)}
              >
                Vazgeç
              </Button>
              <Button
                size="small"
                onClick={save}
                isLoading={busy}
                disabled={!dirty}
              >
                Kaydet
              </Button>
            </div>
          </FocusModal.Header>
          <FocusModal.Body className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="grid min-h-0 flex-1 grid-cols-1 divide-y lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              <div className="flex min-h-0 flex-col gap-3 overflow-y-auto p-6">
                <div>
                  <FocusModal.Title asChild>
                    <Heading level="h2">{data.title}: açıklama</Heading>
                  </FocusModal.Title>
                  <FocusModal.Description asChild>
                    <Text size="small" className="text-ui-fg-subtle">
                      Düz yazı yazın; mağaza başlıkları, maddeleri ve teknik
                      tabloyu kendisi biçimlendirir. Düğmeler imlecin olduğu
                      satırın altına ekler.
                    </Text>
                  </FocusModal.Description>
                </div>
                <div className="flex flex-wrap gap-2">
                  {SNIPPETS.map((s) => (
                    <Button
                      key={s.label}
                      size="small"
                      variant="secondary"
                      title={s.hint}
                      onClick={() => insert(s)}
                    >
                      + {s.label}
                    </Button>
                  ))}
                  {!draft.trim() && (
                    <Button
                      size="small"
                      variant="transparent"
                      onClick={() => setDraft(TEMPLATE)}
                    >
                      Örnek şablonu ekle
                    </Button>
                  )}
                </div>
                <Textarea
                  ref={ref}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="min-h-[420px] flex-1 font-mono text-[13px] leading-6"
                  spellCheck
                />
                <Rules />
              </div>
              <div className="min-h-0 overflow-y-auto bg-ui-bg-subtle p-6">
                <Text
                  size="xsmall"
                  weight="plus"
                  className="mb-3 uppercase text-ui-fg-muted"
                >
                  Önizleme
                </Text>
                <div className="rounded-lg border bg-ui-bg-base p-5">
                  {draftBlocks.length ? (
                    <Preview blocks={draftBlocks} />
                  ) : (
                    <Text size="small" className="text-ui-fg-subtle">
                      Yazdıkça burada görünecek.
                    </Text>
                  )}
                </div>
              </div>
            </div>
          </FocusModal.Body>
        </FocusModal.Content>
      </FocusModal>
    </Container>
  );
};

const Rules = () => (
  <div className="rounded-lg border bg-ui-bg-subtle p-4">
    <Text size="small" weight="plus" className="mb-2">
      Yazım kuralları
    </Text>
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-ui-fg-subtle txt-small">
      <dt className="font-mono text-ui-fg-base">Başlık:</dt>
      <dd>Tek başına bir satır, sonu iki nokta (:) ya da soru işareti</dd>
      <dt className="font-mono text-ui-fg-base">• Madde</dt>
      <dd>Satır başında • veya - ve bir boşluk</dd>
      <dt className="font-mono text-ui-fg-base">• Başlık: açıklama</dt>
      <dd>Kalın başlıklı madde (çoğu böyleyse kart olarak gösterilir)</dd>
      <dt className="font-mono text-ui-fg-base">Etiket: değer</dt>
      <dd>Kısa değerli satırlar "Teknik bilgiler" tablosuna gider</dd>
      <dt className="font-mono text-ui-fg-base">Soru?</dt>
      <dd>Hemen alt satırına cevabı: açılır kapanır soru olur</dd>
      <dt className="font-mono text-ui-fg-base">(boş satır)</dt>
      <dd>Yeni paragraf</dd>
    </dl>
  </div>
);

/** Admin copy of the storefront look (modules/products/components/product-description). */
const Preview = ({ blocks }: { blocks: DescriptionBlock[] }) => {
  const { body, specs } = splitDescription(blocks);
  return (
    <div className="flex flex-col gap-4 text-ui-fg-subtle txt-small">
      {body.map((block, n) => {
        switch (block.type) {
          case "heading":
            return (
              <div
                key={n}
                className={clx("flex items-center gap-2", n > 0 && "pt-2")}
              >
                <span className="h-4 w-1 rounded-full bg-ui-tag-blue-icon" />
                <Text weight="plus" className="text-ui-fg-base">
                  {block.text}
                </Text>
              </div>
            );
          case "paragraph":
            return (
              <p
                key={n}
                className={clx(
                  "whitespace-pre-line",
                  n === 0 &&
                    !block.label &&
                    block.text.length <= 120 &&
                    "txt-medium-plus text-ui-fg-base",
                )}
              >
                {block.label && (
                  <strong className="text-ui-fg-base">{block.label}: </strong>
                )}
                {block.text}
              </p>
            );
          case "list":
            return (
              <ul key={n} className="flex flex-col gap-1.5">
                {block.items.map((item, k) => (
                  <li key={k} className="flex gap-2">
                    <CheckMini className="mt-0.5 shrink-0 text-ui-tag-blue-icon" />
                    <span>
                      {item.label && (
                        <strong className="text-ui-fg-base">
                          {item.label}:{" "}
                        </strong>
                      )}
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            );
          case "specs":
            return <Specs key={n} rows={block.rows} />;
          case "faq":
            return (
              <div key={n} className="divide-y rounded-lg border">
                {block.items.map((item, k) => (
                  <details key={k} className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 font-medium text-ui-fg-base">
                      {item.question}
                      <ChevronDownMini className="shrink-0 transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="px-3 pb-3">{item.answer}</p>
                  </details>
                ))}
              </div>
            );
        }
      })}
      {specs.length > 0 && (
        <div className="flex flex-col gap-2 pt-2">
          <Text weight="plus" className="text-ui-fg-base">
            Teknik bilgiler (sağ sütunda)
          </Text>
          <Specs rows={specs} />
        </div>
      )}
    </div>
  );
};

const Specs = ({ rows }: { rows: DescriptionRow[] }) => (
  <dl className="overflow-hidden rounded-lg border">
    {rows.map((row, n) => (
      <div
        key={n}
        className="grid grid-cols-2 gap-3 px-3 py-1.5 odd:bg-ui-bg-subtle"
      >
        <dt>{row.label}</dt>
        <dd className="font-medium text-ui-fg-base">{row.value}</dd>
      </div>
    ))}
  </dl>
);

export const config = defineWidgetConfig({
  zone: "product.details.after",
});

export default ProductDescriptionWidget;
