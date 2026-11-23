import { STORE_INFO } from "@lib/store-config"
import CopyButton from "./copy-button"

/** Bank accounts for "Havale / EFT" orders. */
const BankTransferInfo = ({
  orderNumber,
}: {
  orderNumber?: string | number
}) => {
  const { bank } = STORE_INFO
  return (
    <div
      className="rounded-xl border border-line bg-white p-4 text-sm text-navy"
      data-testid="bank-transfer-info"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted">Alıcı</p>
          <p
            className="truncate text-[12px] font-semibold xsmall:text-[13px]"
            title={bank.accountHolder}
          >
            {bank.accountHolder}
          </p>
        </div>
        <CopyButton value={bank.accountHolder} label="Alıcı adını" />
      </div>

      <ul className="mt-2 flex flex-col divide-y divide-line">
        {bank.accounts.map((a) => (
          <li key={a.iban} className="flex items-center gap-3 px-3 py-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-white p-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={a.logo}
                alt=""
                className="h-full w-full object-contain"
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-brand-ink">{a.name}</p>
              <p className="select-all break-all font-mono text-[13px] font-semibold tracking-wide">
                {a.iban}
              </p>
            </div>
            <CopyButton
              value={a.iban.replace(/\s/g, "")}
              label={`${a.name} IBAN'ını`}
            />
          </li>
        ))}
      </ul>

      {orderNumber !== undefined && (
        <p className="mt-3">
          <span className="text-muted">Açıklama: </span>
          <span className="font-semibold">Sipariş no: {orderNumber}</span>
        </p>
      )}
      <p className="mt-2 text-xs leading-5 text-navy/70">
        {orderNumber !== undefined
          ? "Hesaplardan birine ödeme yaparken açıklamaya sipariş numaranızı yazın. Ödemeniz hesabımıza geçtiğinde siparişiniz hazırlanmaya başlar."
          : "Siparişi tamamladıktan sonra bu hesaplardan birine ödeme yapmanız yeterli. Açıklamaya yazacağınız sipariş numarası bir sonraki sayfada görünecek."}
      </p>
    </div>
  )
}

export default BankTransferInfo
