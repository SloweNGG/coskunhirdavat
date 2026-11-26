import { AdminCreateHeroSlide, AdminUpdateHeroSlide } from "../../api/admin/hero-slides/validators"

describe("hero slide validators", () => {
  it("requires a title on create and turns empty texts into null", () => {
    expect(AdminCreateHeroSlide.safeParse({}).success).toBe(false)

    const parsed = AdminCreateHeroSlide.parse({ title: " Yeni ", accent: "", button_url: "" })
    expect(parsed).toMatchObject({ title: "Yeni", accent: null, button_url: null })
  })

  it("accepts store paths, anchors and full URLs as links, nothing else", () => {
    for (const url of ["/store", "/categories/kaynak", "#kategoriler", "https://example.com"]) {
      expect(AdminUpdateHeroSlide.safeParse({ button_url: url }).success).toBe(true)
    }
    for (const url of ["store", "javascript:alert(1)", "ftp://x"]) {
      expect(AdminUpdateHeroSlide.safeParse({ button_url: url }).success).toBe(false)
    }
  })

  it("allows a partial update and checks the schedule and duration", () => {
    expect(AdminUpdateHeroSlide.safeParse({ is_active: false }).success).toBe(true)
    expect(
      AdminUpdateHeroSlide.safeParse({
        starts_at: "2026-12-02T00:00:00.000Z",
        ends_at: "2026-12-01T00:00:00.000Z",
      }).success
    ).toBe(false)
    expect(AdminUpdateHeroSlide.safeParse({ duration: 1 }).success).toBe(false)
    expect(AdminUpdateHeroSlide.safeParse({ theme: "purple" }).success).toBe(false)
  })
})
