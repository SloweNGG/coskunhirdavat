/** Validates a Turkish national ID number (TC kimlik no) with its checksum digits. */
export const isValidTckn = (value: string) => {
  if (!/^[1-9]\d{10}$/.test(value)) return false
  const d = value.split("").map(Number)
  const odd = d[0] + d[2] + d[4] + d[6] + d[8]
  const even = d[1] + d[3] + d[5] + d[7]
  const d10 = (((odd * 7 - even) % 10) + 10) % 10
  const d11 = d.slice(0, 10).reduce((a, b) => a + b, 0) % 10
  return d[9] === d10 && d[10] === d11
}
