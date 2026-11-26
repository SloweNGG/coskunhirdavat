/**
 * Turns a product description written as plain text into blocks the store
 * can style: headings, paragraphs, bullet lists, spec rows and Q&A.
 *
 * The same file lives in two places and must stay identical (a unit test
 * compares them):
 *   apps/backend/src/lib/product-description.ts      (admin editor preview)
 *   apps/storefront/src/lib/util/product-description.ts (product page)
 *
 * Writing rules (shown in the admin editor too):
 *   Başlık:                 a line ending with ":" or "?" on its own
 *   • madde / - madde       bullet; "• Etiket: açıklama" gets a bold label
 *   Etiket: değer           short "label: value" lines go to the spec table
 *   Soru?                   a question line directly followed by its answer
 *   Cevap.                  becomes a Q&A item
 *   (blank line)            starts a new paragraph
 *
 * Imported descriptions use many other shapes (label and value on separate
 * lines, numbered lists, headings without a colon); those are recognised
 * too, so nothing has to be rewritten by hand.
 */

export type DescriptionItem = { label?: string; text: string }
export type DescriptionRow = { label: string; value: string }

export type DescriptionBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string; label?: string }
  | { type: "list"; items: DescriptionItem[] }
  | { type: "specs"; rows: DescriptionRow[] }
  | { type: "faq"; items: { question: string; answer: string }[] }

const BULLET = /^(?:[•●▪◦▸►·✓✔*\-–—]|\d{1,2}[.)])\s+(.*)$/
const EXPLICIT_HEADING = /^#{1,4}\s+(.+)$/
const LABEL_ONLY = /^([^:]{1,80}?)\s*(?::\s*)+$/
const SPEC_LABEL_MAX = 45
const SPEC_VALUE_MAX = 60

const clean = (s: string) =>
  s
    .replace(/ /g, " ")
    .replace(/[ \t]+/g, " ")
    .trim()

// No regex /u flag: the storefront still compiles for ES5
const hasLetter = (s: string) => s.toLowerCase() !== s.toUpperCase()
const startsLower = (w: string) =>
  !!w &&
  w[0] !== w[0].toLocaleUpperCase("tr") &&
  w[0] === w[0].toLocaleLowerCase("tr")
const endsSentence = (s: string) => /[.!…]$/.test(s)

/** "Etiket: değer" -> { label, value }; null when the colon is not a label separator. */
export const splitLabel = (
  line: string
): { label: string; value: string } | null => {
  const m = line.match(/^([^:]{1,80}?)\s*:+\s*(.+)$/)
  if (!m) {
    return null
  }
  const label = clean(m[1])
  const value = clean(m[2].replace(/^:+\s*/, ""))
  if (!label || !value || !hasLetter(label)) {
    return null
  }
  // 15:30, 1:10 ratios
  if (/\d$/.test(label) && /^\d/.test(value)) {
    return null
  }
  // https://...
  if (value.startsWith("//")) {
    return null
  }
  if (label.split(" ").length > 8) {
    return null
  }
  return { label, value }
}

const isShortSpec = (kv: { label: string; value: string } | null) =>
  !!kv &&
  kv.label.length <= SPEC_LABEL_MAX &&
  kv.value.length <= SPEC_VALUE_MAX &&
  !endsSentence(kv.value)

const labelOnly = (line: string) => {
  const m = line.match(LABEL_ONLY)
  return m && hasLetter(m[1]) ? clean(m[1]) : null
}

const looksLikeTitle = (line: string) => {
  if (line.length > 60 || /[.!,;]$/.test(line) || /\d/.test(line)) {
    return false
  }
  const words = line.split(" ")
  if (startsLower(words[0])) {
    return false
  }
  return (
    words.length <= 4 ||
    (words.length <= 8 && words.every((w) => !startsLower(w)))
  )
}

const FAQ_HEADING = /sık sorulan|sorular|^sss$/i

type Line = { text: string; bullet: string | null }

export const parseDescription = (
  raw: string | null | undefined
): DescriptionBlock[] => {
  if (!raw?.trim()) {
    return []
  }

  // null = blank line
  const lines: (Line | null)[] = raw
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => clean(l))
    .map((text) => {
      if (!text) {
        return null
      }
      const b = text.match(BULLET)
      return b ? { text, bullet: clean(b[1]) } : { text, bullet: null }
    })

  const blocks: DescriptionBlock[] = []
  let i = 0
  let inFaq = false
  // Headings guessed only from a short line between blank lines
  const soft = new Set<DescriptionBlock>()

  const nextIndex = (from: number) => {
    let j = from
    while (j < lines.length && lines[j] === null) {
      j++
    }
    return j
  }
  const at = (j: number) => (j < lines.length ? lines[j] : null)

  /** One spec row starting at line j: "Etiket: değer" or "Etiket:" + value on the next line. */
  const specAt = (j: number): { row: DescriptionRow; next: number } | null => {
    const line = at(j)
    if (!line || line.bullet) {
      return null
    }
    const kv = splitLabel(line.text)
    // "Tek alette üç iş: germe, kesme" right above a list introduces it
    if (isShortSpec(kv) && !at(j + 1)?.bullet) {
      return { row: { label: kv!.label, value: kv!.value }, next: j + 1 }
    }
    const label = labelOnly(line.text)
    if (!label || label.length > SPEC_LABEL_MAX) {
      return null
    }
    const k = nextIndex(j + 1)
    const value = at(k)
    if (
      !value ||
      value.bullet ||
      labelOnly(value.text) ||
      value.text.length > SPEC_VALUE_MAX ||
      /[.?!]$/.test(value.text)
    ) {
      return null
    }
    // A lone "Başlık:" + short sentence is a heading, not a spec; require the
    // pattern to continue (another spec follows) before accepting it.
    const after = nextIndex(k + 1)
    const follow = at(after)
    const followLabel = !!follow && !follow.bullet && !!labelOnly(follow.text)
    const continues =
      followLabel ||
      (!!follow && !follow.bullet && isShortSpec(splitLabel(follow.text)))
    if (!continues && after < lines.length) {
      return null
    }
    // "Etiket:" followed by "X: Y" is a heading over a spec row, unless the
    // label/value rhythm clearly goes on ("Ölçü :" / "(W): 60 mm" / "Ağırlık :")
    if (splitLabel(value.text) && !followLabel) {
      return null
    }
    return { row: { label, value: value.text }, next: k + 1 }
  }

  while (i < lines.length) {
    const line = lines[i]
    if (!line) {
      i++
      continue
    }

    const explicit = !line.bullet && line.text.match(EXPLICIT_HEADING)
    if (explicit) {
      const text = clean(explicit[1].replace(/:$/, ""))
      blocks.push({ type: "heading", text })
      inFaq = FAQ_HEADING.test(text)
      i++
      continue
    }

    // Bullets (blank lines between bullets keep the list together)
    if (line.bullet !== null) {
      const items: string[] = []
      let j = i
      while (j < lines.length) {
        const l = lines[j]
        if (l === null) {
          const k = nextIndex(j)
          if (at(k)?.bullet == null) {
            break
          }
          j = k
          continue
        }
        if (l.bullet === null) {
          break
        }
        if (l.bullet) {
          items.push(l.bullet)
        }
        j++
      }
      i = j
      const kvs = items.map(splitLabel)
      if (items.length && kvs.every(isShortSpec)) {
        blocks.push({
          type: "specs",
          rows: kvs.map((kv) => ({ label: kv!.label, value: kv!.value })),
        })
      } else if (items.length) {
        blocks.push({
          type: "list",
          items: items.map((text, n) => {
            const kv = kvs[n]
            return kv && kv.label.length <= 60
              ? { label: kv.label, text: kv.value }
              : { text }
          }),
        })
      }
      continue
    }

    // Spec rows
    const first = specAt(i)
    if (first) {
      const rows = [first.row]
      let j = nextIndex(first.next)
      let spec = specAt(j)
      while (spec) {
        rows.push(spec.row)
        j = nextIndex(spec.next)
        spec = specAt(j)
      }
      blocks.push({ type: "specs", rows })
      i = j
      continue
    }

    // Question followed by its answer: directly below it, or after a blank
    // line inside a "Sık Sorulan Sorular" section
    if (line.text.endsWith("?") && line.text.length <= 140) {
      const start = inFaq ? nextIndex(i + 1) : i + 1
      const answer = at(start)
      if (answer && answer.bullet === null && !answer.text.endsWith("?")) {
        const parts: string[] = []
        let j = start
        while (
          at(j) &&
          at(j)!.bullet === null &&
          !(j > start && at(j)!.text.endsWith("?"))
        ) {
          parts.push(at(j)!.text)
          j++
        }
        blocks.push({
          type: "faq",
          items: [{ question: line.text, answer: parts.join(" ") }],
        })
        i = j
        continue
      }
    }

    // Headings: "Başlık:" / "Başlık?" on its own, a short line right above a
    // list, or a short title line followed by a blank line
    const nextLine = at(i + 1)
    const colonHeading = labelOnly(line.text)
    if (
      (colonHeading && colonHeading.length <= 80) ||
      (line.text.endsWith("?") && line.text.length <= 120) ||
      (nextLine?.bullet != null &&
        line.text.length <= 80 &&
        !/[.!]$/.test(line.text)) ||
      (lines[i + 1] === null &&
        i + 1 < lines.length &&
        looksLikeTitle(line.text))
    ) {
      const text = colonHeading ?? line.text
      const heading: DescriptionBlock = { type: "heading", text }
      if (
        !colonHeading &&
        !line.text.endsWith("?") &&
        nextLine?.bullet == null
      ) {
        soft.add(heading)
      }
      blocks.push(heading)
      inFaq = FAQ_HEADING.test(text)
      i++
      continue
    }

    // Paragraph: consecutive plain lines
    const parts: string[] = []
    let j = i
    while (at(j) && at(j)!.bullet === null) {
      const t = at(j)!.text
      if (j > i && (labelOnly(t) || specAt(j) || EXPLICIT_HEADING.test(t))) {
        break
      }
      parts.push(t)
      j++
    }
    i = j
    let text = parts[0]
    for (const p of parts.slice(1)) {
      text += /[.!?;:,]$/.test(text) ? ` ${p}` : `\n${p}`
    }
    const kv = parts.length === 1 ? splitLabel(text) : null
    blocks.push(
      kv && kv.label.length <= 40
        ? { type: "paragraph", label: kv.label, text: kv.value }
        : { type: "paragraph", text }
    )
  }

  // Short lines between blank lines that are not followed by any content
  // ("Alüminyum Oksit yapı", "Uzun ömürlü dayanım", ...) are a list, not
  // headings
  const isSoft = (n: number) => soft.has(blocks[n])
  const resolved = blocks.map((block, n): DescriptionBlock => {
    if (!isSoft(n) || block.type !== "heading") {
      return block
    }
    const next = blocks[n + 1]
    const inRun = isSoft(n - 1) || isSoft(n + 1)
    if (inRun || !next || next.type === "heading") {
      return { type: "list", items: [{ text: block.text }] }
    }
    return block
  })

  // Merge neighbours of the same kind
  const merged: DescriptionBlock[] = []
  for (const block of resolved) {
    const prev = merged[merged.length - 1]
    if (prev?.type === "list" && block.type === "list") {
      prev.items.push(...block.items)
    } else if (prev?.type === "specs" && block.type === "specs") {
      prev.rows.push(...block.rows)
    } else if (prev?.type === "faq" && block.type === "faq") {
      prev.items.push(...block.items)
    } else {
      merged.push(block)
    }
  }
  return merged
}

const norm = (s: string) =>
  s.toLocaleLowerCase("tr").replace(/\s+/g, " ").trim()

/**
 * Splits parsed blocks for the product page: spec rows go to the "Teknik
 * bilgiler" table, everything else stays in the text column. A heading that
 * only introduced spec rows is dropped with them.
 */
export const splitDescription = (blocks: DescriptionBlock[]) => {
  const specs = blocks.flatMap((b) => (b.type === "specs" ? b.rows : []))
  const seen = new Set(specs.map((row) => norm(row.label)))
  // The same label twice means several models/sizes are described one after
  // the other; one merged table would lose values, so keep them in place.
  if (seen.size < specs.length) {
    return {
      body: blocks,
      specs: [] as DescriptionRow[],
      hasLabel: () => false,
    }
  }
  const body: DescriptionBlock[] = []
  blocks.forEach((block, n) => {
    if (block.type === "specs") {
      return
    }
    if (block.type === "heading" && blocks[n + 1]?.type === "specs") {
      return
    }
    body.push(block)
  })
  return { body, specs, hasLabel: (label: string) => seen.has(norm(label)) }
}
