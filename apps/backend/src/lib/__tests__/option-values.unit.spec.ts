import { toOptionValues } from "../../search/helpers/option-values"

describe("toOptionValues", () => {
  it("flattens options into title:value entries", () => {
    expect(
      toOptionValues([
        { title: "Beden", values: [{ value: "L" }, { value: "XL" }] },
        { title: "Adet", values: [{ value: "12 Çift" }] },
      ])
    ).toEqual(["Beden:L", "Beden:XL", "Adet:12 Çift"])
  })

  it("leaves out the placeholder option of option-less products", () => {
    expect(
      toOptionValues([{ title: "Seçenek", values: [{ value: "Standart" }] }])
    ).toEqual([])
  })
})
