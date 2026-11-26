/**
 * Renders a formatted price like "1.026,00 TL" in the price font (font-price,
 * currently the main font Instrument Sans; tabular-nums lines up stacked
 * amounts where the font has tabular figures)
 * with the kuruş part small and raised: 1.026⁰⁰ TL. Weight and size come
 * from the parent. Any other format is rendered unchanged, in the same font.
 */
const PriceText = ({ value }: { value?: string | null }) => {
  if (!value) return null
  const match = value.match(/^(.*?)(,\d+)(\s?TL)$/)
  if (!match) return <span className="font-price tabular-nums">{value}</span>

  const [, lira, kurus, suffix] = match
  return (
    <span className="whitespace-nowrap font-price tabular-nums tracking-[-0.01em]">
      {lira}
      <span className="relative -top-[0.62em] ml-[0.03em] text-[0.52em]">
        {kurus}
      </span>
      <span className="ml-[0.1em] text-[0.62em]">{suffix.trim()}</span>
    </span>
  )
}

export default PriceText
