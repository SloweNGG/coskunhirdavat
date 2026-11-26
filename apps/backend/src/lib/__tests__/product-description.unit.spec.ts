import { readFileSync } from "fs";
import path from "path";
import {
  parseDescription,
  splitDescription,
  splitLabel,
} from "../product-description";

describe("product description parser", () => {
  it("is identical to the storefront copy", () => {
    const read = (p: string) =>
      readFileSync(path.resolve(__dirname, p), "utf8");
    expect(
      read("../../../../storefront/src/lib/util/product-description.ts"),
    ).toBe(read("../product-description.ts"));
  });

  it("parses the editor syntax", () => {
    const blocks = parseDescription(`Kısa tanıtım metni.

Öne Çıkan Özellikler:
• Dayanıklı gövde: uzun ömürlü kullanım sağlar
• Kolay kullanım

Teknik Özellikler:
Marka: YSB
Ölçü: 50 cm

Sık Sorulan Sorular:
Kutudan neler çıkar?
Taşıma çantası.`);
    expect(blocks).toEqual([
      { type: "paragraph", text: "Kısa tanıtım metni." },
      { type: "heading", text: "Öne Çıkan Özellikler" },
      {
        type: "list",
        items: [
          { label: "Dayanıklı gövde", text: "uzun ömürlü kullanım sağlar" },
          { text: "Kolay kullanım" },
        ],
      },
      { type: "heading", text: "Teknik Özellikler" },
      {
        type: "specs",
        rows: [
          { label: "Marka", value: "YSB" },
          { label: "Ölçü", value: "50 cm" },
        ],
      },
      { type: "heading", text: "Sık Sorulan Sorular" },
      {
        type: "faq",
        items: [
          { question: "Kutudan neler çıkar?", answer: "Taşıma çantası." },
        ],
      },
    ]);
  });

  it("turns short label/value bullets into spec rows, long ones into labelled items", () => {
    const [specs, heading, list] = parseDescription(`• Marka: YSB
• Kalınlık: 17 Mikron

Neden YSB?
• Ergonomik Tasarım: Toplam 2 kg ağırlığı sayesinde gün boyu süren sarımlarda personeli yormaz.
• Yüksek Şeffaflık: Barkodlar kolayca okunur.`);
    expect(specs).toEqual({
      type: "specs",
      rows: [
        { label: "Marka", value: "YSB" },
        { label: "Kalınlık", value: "17 Mikron" },
      ],
    });
    expect(heading).toEqual({ type: "heading", text: "Neden YSB?" });
    expect(list.type).toBe("list");
  });

  it("reads label and value on separate lines (imported spec sheets)", () => {
    const blocks = parseDescription(`Çalışma Şekli :

Otomatik
Dokunmatik Ekran :: Yok
Minimum Ürün Ölçüsü :

(W): 60 mm - (H): 60 mm
Güç gereksinimi: :

220V | 50-60 Hz`);
    expect(blocks).toEqual([
      {
        type: "specs",
        rows: [
          { label: "Çalışma Şekli", value: "Otomatik" },
          { label: "Dokunmatik Ekran", value: "Yok" },
          { label: "Minimum Ürün Ölçüsü", value: "(W): 60 mm - (H): 60 mm" },
          { label: "Güç gereksinimi", value: "220V | 50-60 Hz" },
        ],
      },
    ]);
  });

  it("keeps a heading over a long paragraph a heading", () => {
    expect(
      parseDescription(
        "Ürün Açıklaması:\nDepolama ve lojistik süreçlerinde güvenli sevkiyat sağlar.",
      ),
    ).toEqual([
      { type: "heading", text: "Ürün Açıklaması" },
      {
        type: "paragraph",
        text: "Depolama ve lojistik süreçlerinde güvenli sevkiyat sağlar.",
      },
    ]);
  });

  it("reads Q&A separated by blank lines inside an FAQ section", () => {
    const blocks = parseDescription(`Sık Sorulan Sorular

Tripod kutuya dahil mi?

Hayır. Tripod ayrıca satılır.

İç mekânda kullanılabilir mi?

Evet.`);
    expect(blocks[1]).toEqual({
      type: "faq",
      items: [
        {
          question: "Tripod kutuya dahil mi?",
          answer: "Hayır. Tripod ayrıca satılır.",
        },
        { question: "İç mekânda kullanılabilir mi?", answer: "Evet." },
      ],
    });
  });

  it("treats a run of short lines between blank lines as a list", () => {
    expect(
      parseDescription(
        "Alüminyum Oksit yapı\n\nUzun ömürlü dayanım\n\nMermer yüzeylerde yüksek verim sağlar.",
      ),
    ).toEqual([
      {
        type: "list",
        items: [
          { text: "Alüminyum Oksit yapı" },
          { text: "Uzun ömürlü dayanım" },
        ],
      },
      { type: "paragraph", text: "Mermer yüzeylerde yüksek verim sağlar." },
    ]);
  });

  it("does not split times or links as labels", () => {
    expect(splitLabel("Kargo 15:00")).toBeNull();
    expect(splitLabel("Site: https://ornek.com")).toEqual({
      label: "Site",
      value: "https://ornek.com",
    });
    expect(splitLabel("https://ornek.com")).toBeNull();
  });

  it("moves spec rows to the table and drops their heading", () => {
    const { body, specs, hasLabel } = splitDescription(
      parseDescription(
        "Giriş metni.\n\nTeknik Özellikler:\nAğırlık: 2 kg\nRenk: Şeffaf",
      ),
    );
    expect(body).toEqual([{ type: "paragraph", text: "Giriş metni." }]);
    expect(specs).toHaveLength(2);
    expect(hasLabel("ağırlık")).toBe(true);
  });

  it("keeps spec tables in place when several models repeat the same labels", () => {
    const blocks = parseDescription(
      "Model A\n\nHız: 10\nGüç: 1 kW\n\nModel B\n\nHız: 20\nGüç: 2 kW",
    );
    const { body, specs } = splitDescription(blocks);
    expect(specs).toEqual([]);
    expect(body).toBe(blocks);
  });
});
