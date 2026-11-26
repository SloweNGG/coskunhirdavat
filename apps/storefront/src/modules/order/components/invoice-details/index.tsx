import { Text } from "@modules/common/components/ui"

type Invoice = {
  type?: "individual" | "corporate"
  company_name?: string
  tax_office?: string
  tax_number?: string
  tc_number?: string
}

/**
 * Lines describing metadata.invoice (written by setAddresses on the cart and
 * copied to the order on completion): the type first, then its details.
 * Null when no invoice type was chosen.
 */
export const getInvoiceLines = (
  metadata?: Record<string, unknown> | null
): string[] | null => {
  const invoice = metadata?.invoice as Invoice | undefined
  if (!invoice?.type) return null

  if (invoice.type === "corporate") {
    return [
      "Kurumsal",
      invoice.company_name ?? "",
      `Vergi dairesi: ${invoice.tax_office ?? ""}`,
      `Vergi no: ${invoice.tax_number ?? ""}`,
    ]
  }

  return invoice.tc_number
    ? ["Bireysel", `TC kimlik no: ${invoice.tc_number}`]
    : ["Bireysel"]
}

const InvoiceDetails = ({
  metadata,
}: {
  metadata?: Record<string, unknown> | null
}) => {
  const lines = getInvoiceLines(metadata)
  if (!lines) return null

  return (
    <div className="flex flex-col" data-testid="invoice-summary">
      <Text className="txt-medium-plus text-ui-fg-base mb-1">Fatura türü</Text>
      {lines.map((line, i) => (
        <Text key={i} className="txt-medium text-ui-fg-subtle">
          {line}
        </Text>
      ))}
    </div>
  )
}

export default InvoiceDetails
