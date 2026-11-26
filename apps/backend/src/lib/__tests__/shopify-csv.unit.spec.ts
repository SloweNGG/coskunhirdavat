import {
  cleanDescription,
  cleanSeoTitle,
  htmlToText,
  parseCsv,
  toHandle,
} from "../shopify-csv"

describe("parseCsv", () => {
  it("reads quoted fields with commas, doubled quotes and newlines", () => {
    const rows = parseCsv(
      'Handle,Title,Body\r\na,"Kumpas, 150 mm","<p>""Hassas""</p>\n<p>İkinci</p>"\r\nb,Gönye,\r\n'
    )

    expect(rows).toEqual([
      { Handle: "a", Title: "Kumpas, 150 mm", Body: '<p>"Hassas"</p>\n<p>İkinci</p>' },
      { Handle: "b", Title: "Gönye", Body: "" },
    ])
  })

  it("skips blank lines and fills missing trailing fields", () => {
    expect(parseCsv("A,B\n\n1\n")).toEqual([{ A: "1", B: "" }])
  })
})

describe("htmlToText", () => {
  it("turns paragraphs, lists and entities into readable text", () => {
    const html =
      "<p>Giriş &amp; özet</p>\n<ul>\n<li>\n<p>Bir</p>\n</li>\n<li><p>İki</p></li>\n</ul><p>Son</p>"

    expect(htmlToText(html)).toBe("Giriş & özet\n• Bir\n• İki\n\nSon")
  })

  it("turns two-column table rows into label: value lines", () => {
    const html =
      "<table><tr><th>Ölçüm</th><th>150 mm</th></tr><tr><td>Hassasiyet</td><td>0,02 mm</td></tr></table>"

    expect(htmlToText(html)).toBe("Ölçüm: 150 mm\nHassasiyet: 0,02 mm")
  })

  it("drops tags and collapses whitespace from the HTML source", () => {
    expect(htmlToText('<p><strong>YSB</strong>   kumpas<br>yeni   satır <img src="x.png"></p>')).toBe(
      "YSB kumpas\nyeni satır"
    )
  })
})

describe("toHandle", () => {
  it("maps Turkish letters to ASCII", () => {
    expect(toHandle("Çelik Şerit Gönye Işık Ölçü")).toBe("celik-serit-gonye-isik-olcu")
  })

  it("removes combining marks left over from Shopify handles", () => {
    expect(toHandle("ysb-export-print-pp-3-dil-baskili-i\u0307hrac")).toBe(
      "ysb-export-print-pp-3-dil-baskili-ihrac"
    )
  })
})

describe("cleanDescription", () => {
  it("drops the brand shop's shipping question and answer", () => {
    const text = [
      "Sık sorulan sorular",
      "Kargo ne zaman çıkar?",
      "Hafta içi saat 15:00'e kadar verilen stoklu siparişler aynı gün kargoya teslim edilir. 2.500 TL ve üzeri siparişlerde kargo ücretsizdir.",
      "Toka kullanır mı?",
      "Evet, sac toka kullanır.",
    ].join("\n")

    expect(cleanDescription(text)).toBe(
      "Sık sorulan sorular\nToka kullanır mı?\nEvet, sac toka kullanır."
    )
  })

  it("removes sentences with links but keeps the rest of the answer", () => {
    expect(
      cleanDescription(
        "Akülü çember makinesi daha uygundur; toka kullanmaz. Modeller: → https://ysb.com.tr/collections/akulu-cember-makineleri"
      )
    ).toBe("Akülü çember makinesi daha uygundur; toka kullanmaz.")
  })

  it("cuts a free-shipping clause out of a sentence", () => {
    expect(
      cleanDescription("Elektrik gerektirmez, 2.500 TL üzeri kargo ücretsiz.")
    ).toBe("Elektrik gerektirmez.")
  })

  it("drops the brand shop's seller promises and dangling link labels", () => {
    const text = [
      "YSB Güvencesi: Yerli stok, hızlı teslimat ve satış sonrası destek.",
      "YSB olarak satış sonrası teknik destek sunuyoruz. Buradayız.",
      "Daha fazla bilgi için bize ulaşın: İletişim Sayfası",
    ].join("\n")

    expect(cleanDescription(text)).toBe("Daha fazla bilgi için bize ulaşın.")
  })

  it("keeps product facts, the brand name and other uses of kargo", () => {
    const text = [
      "YSB güvencesiyle sunulan profesyonel bits uçlar uzun ömürlüdür.",
      "E-ticaret kargo gönderileri ve kolileme için idealdir.",
      "Çember genişliği: 12–16 mm. Kalınlık: 0,4–1 mm.",
      "TIG D.C. (-)",
    ].join("\n")

    expect(cleanDescription(text)).toBe(text)
  })
})

describe("cleanSeoTitle", () => {
  it("removes the brand shop's name from the end", () => {
    expect(cleanSeoTitle("Manuel PET Çember Germe Seti | YSB")).toBe(
      "Manuel PET Çember Germe Seti"
    )
    expect(cleanSeoTitle("YSB 150 mm Kumpas")).toBe("YSB 150 mm Kumpas")
  })
})
