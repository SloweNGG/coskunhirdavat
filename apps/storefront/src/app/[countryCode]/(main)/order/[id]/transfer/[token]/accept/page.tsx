import { acceptTransferRequest } from "@lib/data/orders"
import { Heading, Text } from "@modules/common/components/ui"
import TransferImage from "@modules/order/components/transfer-image"

export default async function TransferPage({
  params,
}: {
  params: Promise<{ id: string; token: string }>
}) {
  const { id, token } = await params

  const { success, error } = await acceptTransferRequest(id, token)

  return (
    <div className="flex flex-col gap-y-4 items-start w-2/5 mx-auto mt-10 mb-20">
      <TransferImage />
      <div className="flex flex-col gap-y-6">
        {success && (
          <>
            <Heading level="h1" className="text-xl text-zinc-900">
              Sipariş devredildi!
            </Heading>
            <Text className="text-zinc-600">
              {id} numaralı sipariş yeni sahibine başarıyla devredildi.
            </Text>
          </>
        )}
        {!success && (
          <>
            <Text className="text-zinc-600">
              Devir kabul edilirken bir hata oluştu. Lütfen tekrar deneyin.
            </Text>
            {error && (
              <Text className="text-red-500">Hata mesajı: {error}</Text>
            )}
          </>
        )}
      </div>
    </div>
  )
}
