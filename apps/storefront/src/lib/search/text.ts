/**
 * Text helpers for product search, shared by the server (typo fallback) and
 * the header search box (match highlighting, category matching).
 *
 * Everything compares a folded form: Turkish lower case with the diacritics
 * dropped, so "ÖLÇÜ", "ölçü" and "olcu" are the same word. Folding maps every
 * UTF-16 code unit to exactly one code unit, so a position in the folded text
 * is the same position in the original.
 */

const DIACRITICS: Record<string, string> = {
  â: "a",
  ç: "c",
  ğ: "g",
  ı: "i",
  î: "i",
  ö: "o",
  ş: "s",
  ü: "u",
  û: "u",
}

const foldUnit = (unit: string) => {
  const lower = unit.toLocaleLowerCase("tr")
  const single = lower.length === 1 ? lower : unit
  return DIACRITICS[single] ?? single
}

export const fold = (text: string) => {
  let out = ""
  for (let i = 0; i < text.length; i++) {
    out += foldUnit(text[i])
  }
  return out
}

// Built at runtime: the TypeScript target predates the `u` flag, browsers don't.
const WORD = new RegExp("[\\p{L}\\p{N}]+", "gu")

/** Runs of letters and digits: "SW-DS100 Lazer" -> ["SW", "DS100", "Lazer"]. */
export const words = (text: string) => text.match(WORD) ?? []

export type TextPart = { text: string; match: boolean }

/**
 * Splits `text` into matched and unmatched parts for highlighting. A word
 * matches when it starts with one of the query's words, which mirrors the
 * prefix search the backend runs.
 */
export const highlightParts = (text: string, query: string): TextPart[] => {
  const tokens = Array.from(new Set(words(fold(query))))
  if (!tokens.length || !text) {
    return [{ text, match: false }]
  }

  const marked = new Array<boolean>(text.length).fill(false)
  const folded = fold(text)
  const pattern = new RegExp(WORD)
  let found: RegExpExecArray | null
  while ((found = pattern.exec(folded))) {
    const word = found[0]
    const start = found.index
    const length = tokens.reduce(
      (longest, token) =>
        word.startsWith(token) && token.length > longest
          ? token.length
          : longest,
      0
    )
    for (let i = 0; i < length; i++) {
      marked[start + i] = true
    }
  }

  const parts: TextPart[] = []
  for (let i = 0; i < text.length; i++) {
    const last = parts[parts.length - 1]
    if (last && last.match === marked[i]) {
      last.text += text[i]
    } else {
      parts.push({ text: text[i], match: marked[i] })
    }
  }
  return parts
}

const commonPrefixLength = (a: string, b: string) => {
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  return i
}

/**
 * Whether a name (e.g. a category) is about one of the query's words, loose
 * enough for Turkish suffixes: "terazisi" matches "Su Terazileri".
 */
export const nameMatches = (name: string, query: string) => {
  const tokens = words(fold(query))
  return words(fold(name)).some((word) =>
    tokens.some(
      (token) =>
        word.startsWith(token) ||
        (word.length >= 4 && token.startsWith(word)) ||
        commonPrefixLength(word, token) >= 5
    )
  )
}

/**
 * Edit distance with adjacent swaps counted as one edit ("lzaer" -> "lazer"
 * is 1). Stops early and returns `max + 1` once the distance must exceed `max`.
 */
export const editDistance = (a: string, b: string, max: number) => {
  if (Math.abs(a.length - b.length) > max) return max + 1

  let previous2: number[] = []
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j)

  for (let i = 1; i <= a.length; i++) {
    const current = [i]
    let rowMin = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      let value = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + cost
      )
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, previous2[j - 2] + 1)
      }
      current.push(value)
      rowMin = Math.min(rowMin, value)
    }
    if (rowMin > max) return max + 1
    previous2 = previous
    previous = current
  }

  return previous[b.length]
}

export type VocabularyEntry = {
  /** The word as shown to the shopper, Turkish lower case. */
  word: string
  folded: string
  /** How often it appears in the catalog; breaks ties between corrections. */
  count: number
}

/**
 * The catalog's words (product titles) that a misspelt query
 * word can be corrected to. Words with digits are left out: model codes and
 * sizes are never "corrected" into a different product.
 */
export const buildVocabulary = (
  texts: (string | null | undefined)[]
): VocabularyEntry[] => {
  const entries = new Map<string, VocabularyEntry>()
  for (const text of texts) {
    if (!text) continue
    for (const word of words(text)) {
      if (word.length < 3 || /\d/.test(word)) continue
      const folded = fold(word)
      const entry = entries.get(folded)
      if (entry) {
        entry.count++
      } else {
        entries.set(folded, {
          word: word.toLocaleLowerCase("tr"),
          folded,
          count: 1,
        })
      }
    }
  }
  return Array.from(entries.values())
}

const MIN_CORRECTABLE_LENGTH = 4

/**
 * Rewrites the query's unknown words to the closest catalog word, for when
 * the query as typed finds nothing: "lazr metre" -> "lazer metre". The last
 * word may still be half typed, so it also counts as known when a catalog
 * word starts with it, and it is compared against word beginnings too
 * ("carsk" -> "caraskal"). Returns null when nothing would change.
 */
export const correctQuery = (
  query: string,
  vocabulary: VocabularyEntry[]
): string | null => {
  const tokens = words(query)
  if (!tokens.length || !vocabulary.length) return null

  let changed = false
  const corrected = tokens.map((token, index) => {
    const folded = fold(token)
    if (folded.length < MIN_CORRECTABLE_LENGTH || /\d/.test(folded)) {
      return token
    }

    const isLast = index === tokens.length - 1
    const known = vocabulary.some(
      (entry) =>
        entry.folded === folded || (isLast && entry.folded.startsWith(folded))
    )
    if (known) return token

    const maxDistance = folded.length <= 5 ? 1 : 2
    let best: VocabularyEntry | null = null
    let bestDistance = maxDistance + 1

    for (const entry of vocabulary) {
      let distance = editDistance(folded, entry.folded, maxDistance)
      if (isLast && entry.folded.length > folded.length) {
        // A half-typed word: compare with the beginning of the candidate,
        // allowing one wrong, missing or extra letter.
        for (const length of [
          folded.length - 1,
          folded.length,
          folded.length + 1,
        ]) {
          if (editDistance(folded, entry.folded.slice(0, length), 1) <= 1) {
            distance = Math.min(distance, 1)
          }
        }
      }
      if (
        distance < bestDistance ||
        (distance === bestDistance && best && entry.count > best.count)
      ) {
        best = entry
        bestDistance = distance
      }
    }

    if (!best || bestDistance > maxDistance) return token
    changed = true
    return best.word
  })

  if (!changed) return null

  // Swap the words in place so separators like "1,6" or "SW-DS" survive.
  let index = 0
  return query.replace(WORD, () => corrected[index++])
}
