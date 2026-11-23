import { HttpTypes } from "@medusajs/types"
import Checkbox from "@modules/common/components/checkbox"
import Input from "@modules/common/components/input"
import { useState } from "react"

type Invoice = {
  type?: "individual" | "corporate"
  company_name?: string
  tax_office?: string
  tax_number?: string
  tc_number?: string
}

const InvoiceType = ({
  cart,
  besideToggle,
}: {
  cart: HttpTypes.StoreCart | null
  /** rendered on the same row as the "Kurumsal fatura" checkbox */
  besideToggle?: React.ReactNode
}) => {
  const saved = (cart?.metadata?.invoice ?? {}) as Invoice
  const [type, setType] = useState(saved.type ?? "individual")
  const [showTc, setShowTc] = useState(!!saved.tc_number)

  return (
    <fieldset className="mt-7" data-testid="invoice-type">
      <legend className="sr-only">Fatura türü</legend>
      <input type="hidden" name="invoice.type" value={type} />
      <div className="mb-3 flex flex-wrap items-center gap-x-6 gap-y-2">
        <Checkbox
          id="invoice_corporate"
          label="Kurumsal fatura istiyorum."
          checked={type === "corporate"}
          onChange={() =>
            setType((t) => (t === "corporate" ? "individual" : "corporate"))
          }
          data-testid="invoice-type-corporate"
        />
        {besideToggle}
      </div>
      {type === "individual" && !showTc && (
        <button
          type="button"
          onClick={() => setShowTc(true)}
          className="text-sm font-medium text-navy/70 underline-offset-4 hover:text-navy hover:underline"
          data-testid="add-tc-number-button"
        >
          + TC kimlik no ekle (isteğe bağlı)
        </button>
      )}
      {type === "individual" && showTc && (
        <div className="grid grid-cols-1 gap-4 xsmall:grid-cols-2">
          <Input
            label="TC kimlik no (isteğe bağlı)"
            name="invoice.tc_number"
            id="invoice.tc_number"
            inputMode="numeric"
            pattern="\d{11}"
            maxLength={11}
            title="TC kimlik numarası 11 haneli olmalıdır."
            defaultValue={saved.tc_number || ""}
            data-testid="invoice-tc-number-input"
          />
        </div>
      )}
      {type === "corporate" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input
              label="Firma adı"
              name="invoice.company_name"
              id="invoice.company_name"
              autoComplete="organization"
              defaultValue={
                saved.company_name || cart?.billing_address?.company || ""
              }
              required
              data-testid="invoice-company-input"
            />
          </div>
          <Input
            label="Vergi numarası"
            name="invoice.tax_number"
            id="invoice.tax_number"
            inputMode="numeric"
            pattern="\d{10,11}"
            maxLength={11}
            title="Vergi numarası 10 haneli (şahıs şirketleri için 11 haneli TCKN) olmalıdır."
            defaultValue={saved.tax_number || ""}
            required
            data-testid="invoice-tax-number-input"
          />
          <Input
            label="Vergi dairesi"
            name="invoice.tax_office"
            id="invoice.tax_office"
            defaultValue={saved.tax_office || ""}
            required
            data-testid="invoice-tax-office-input"
          />
        </div>
      )}
    </fieldset>
  )
}

export default InvoiceType
