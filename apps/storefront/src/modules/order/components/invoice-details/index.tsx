import { Text } from "@modules/common/components/ui"

type Invoice = {
  type?: "individual" | "corporate"
  company_name?: string
  tax_office?: string
  tax_number?: string
  tc_number?: string
}

// Reads metadata.invoice written by setAddresses (cart) and copied to the order on completion.
const InvoiceDetails = ({
  metadata,
}: {
  metadata?: Record<string, unknown> | null
}) => {
  const invoice = metadata?.invoice as Invoice | undefined
  if (!invoice?.type) return null

  return (
    <div className="flex flex-col" data-testid="invoice-summary">
      <Text className="txt-medium-plus text-ui-fg-base mb-1">Fatura türü</Text>
      <Text className="txt-medium text-ui-fg-subtle">
        {invoice.type === "corporate" ? "Kurumsal" : "Bireysel"}
      </Text>
      {invoice.type === "individual" && invoice.tc_number && (
        <Text className="txt-medium text-ui-fg-subtle">
          TC kimlik no: {invoice.tc_number}
        </Text>
      )}
      {invoice.type === "corporate" && (
        <>
          <Text className="txt-medium text-ui-fg-subtle">
            {invoice.company_name}
          </Text>
          <Text className="txt-medium text-ui-fg-subtle">
            Vergi dairesi: {invoice.tax_office}
          </Text>
          <Text className="txt-medium text-ui-fg-subtle">
            Vergi no: {invoice.tax_number}
          </Text>
        </>
      )}
    </div>
  )
}

export default InvoiceDetails
