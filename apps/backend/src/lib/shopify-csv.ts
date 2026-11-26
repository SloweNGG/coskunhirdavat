/**
 * Helpers for reading a Shopify product export: CSV parsing, description
 * HTML to plain text, and URL-safe handles. Used by
 * src/scripts/import-shopify-products.ts.
 */

export type Row = Record<string, string>

/** RFC 4180 CSV: quoted fields may hold commas, doubled quotes and newlines. */
export const parseCsv = (text: string): Row[] => {
  const records: string[][] = []
  let record: string[] = []
  let field = ""
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]

    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"'
        i++
      } else if (ch === '"') {
        quoted = false
      } else {
        field += ch
      }
    } else if (ch === '"') {
      quoted = true
    } else if (ch === ",") {
      record.push(field)
      field = ""
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") {
        i++
      }
      record.push(field)
      records.push(record)
      record = []
      field = ""
    } else {
      field += ch
    }
  }
  if (field || record.length) {
    record.push(field)
    records.push(record)
  }

  const [header, ...body] = records
  return body
    .filter((r) => r.some((value) => value.trim()))
    .map((r) => Object.fromEntries(header.map((name, i) => [name, r[i] ?? ""])))
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
}

const decodeEntities = (text: string) =>
  text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === "#") {
      const code =
        entity[1].toLowerCase() === "x"
          ? parseInt(entity.slice(2), 16)
          : parseInt(entity.slice(1), 10)
      return Number.isFinite(code) ? String.fromCodePoint(code) : match
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match
  })

/**
 * Shopify description HTML -> readable plain text. Paragraphs and headings
 * become blank-line separated blocks, list items get a bullet, and table rows
 * become "Label: Value" lines.
 */
export const htmlToText = (html: string) => {
  const marked = html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    // Line breaks in HTML source are just spaces; only tags break lines.
    .replace(/\s+/g, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<\/(td|th)>/gi, "\t")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|ul|ol|table|blockquote|article)>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")

  return decodeEntities(marked)
    .split("\n")
    .map((line) => {
      if (!line.includes("\t")) {
        return line.replace(/[ \u00a0]+/g, " ").trim()
      }
      const cells = line
        .split("\t")
        .map((cell) => cell.replace(/[ \u00a0]+/g, " ").trim())
        .filter(Boolean)
      return cells.length === 2 ? `${cells[0]}: ${cells[1]}` : cells.join(" | ")
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    // A <p> inside an <li> would otherwise leave blank lines between bullets.
    .replace(/•\s*\n+/g, "• ")
    .replace(/\n{2,}(?=• )/g, "\n")
    .trim()
}

/** URL-safe handle: Turkish letters to ASCII, anything else to dashes. */
export const toHandle = (value: string) =>
  value
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

const URL_PATTERN = /https?:\/\/\S+|www\.\S+/i

/**
 * Lines written in the voice of the brand's own web shop: its after-sales
 * promises and its shipping questions. Our store states its own terms (the
 * product page's Kargo tab), so these lines are dropped.
 */
const SELLER_LINE_PATTERNS = [/^ysb olarak\b/i, /^ysb güvencesi\s*:/i, /^kargo\b.*\?$/i]

/** "2.500 TL üzeri kargo ücretsiz" style clauses inside an otherwise useful sentence. */
const FREE_SHIPPING_CLAUSE =
  /,?\s*[\d.,]+\s*TL\s+(ve\s+)?üzeri[a-zçğıöşü]*\s+(siparişlerde\s+)?kargo\s+(ücretsiz|bedava)[a-zçğıöşü]*/gi

/** A sentence stating a shipping policy: free shipping, cut-off time, same-day dispatch. */
const isShippingPolicy = (sentence: string) =>
  /kargo/i.test(sentence) && /(ücretsiz|bedava|aynı gün|teslim edilir|saat\s*\d)/i.test(sentence)

const SENTENCE_BREAK = /(?<=[.!?])\s+(?=[A-ZÇĞİÖŞÜ0-9"“(])/

/**
 * Removes what belongs to the brand's web shop rather than to the product:
 * links to that shop, its shipping policy and its seller promises. Product
 * facts (including the YSB brand name) are left alone.
 */
export const cleanDescription = (text: string) =>
  text
    .split("\n")
    .filter((line) => !SELLER_LINE_PATTERNS.some((p) => p.test(line.trim())))
    .flatMap((line) => {
      if (!line.trim()) {
        return [line] // paragraph break, keep it
      }
      const cleaned = line
        // A link label left behind once the link itself is gone.
        .replace(/\s*:\s*İletişim Sayfası\.?\s*$/i, ".")
        .split(SENTENCE_BREAK)
        .flatMap((sentence) => {
          const rest = sentence.replace(FREE_SHIPPING_CLAUSE, "")
          // Only the free-shipping clause was there ("... ücretsizdir." -> ".").
          if (rest !== sentence && !/[0-9a-zçğıöşü]/i.test(rest)) {
            return []
          }
          return URL_PATTERN.test(rest) || isShippingPolicy(rest) ? [] : [rest]
        })
        .join(" ")
      // A line whose every sentence was removed goes away entirely.
      return cleaned ? [cleaned] : []
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()

/** Shopify SEO titles end with the brand shop's name ("... | YSB"); the storefront adds ours. */
export const cleanSeoTitle = (title: string) => title.replace(/\s*\|\s*YSB\s*$/i, "").trim()
