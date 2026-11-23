/**
 * Renders a formatted price like "1.026,00 TL" with the kuruş part small and
 * raised: 1.026⁰⁰ TL. Any other format is rendered unchanged.
 */
const PriceText = ({ value }: { value?: string | null }) => {
  if (!value) return null
  const match = value.match(/^(.*?)(,\d+)(\s?TL)$/)
  if (!match) return <>{value}</>

  const [, lira, kurus, suffix] = match
  return (
    <span className="whitespace-nowrap">
      {lira}
      <span className="relative -top-[0.55em] text-[0.55em] font-semibold">
        {kurus}
      </span>
      <span className="text-[0.7em] font-semibold">{suffix}</span>
    </span>
  )
}

export default PriceText
