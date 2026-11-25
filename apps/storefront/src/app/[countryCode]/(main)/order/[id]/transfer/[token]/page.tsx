import { Heading, Text } from "@modules/common/components/ui"
import TransferActions from "@modules/order/components/transfer-actions"
import TransferImage from "@modules/order/components/transfer-image"

export default async function TransferPage({
  params,
}: {
  params: Promise<{ id: string; token: string }>
}) {
  const { id, token } = await params

  return (
    <div className="flex flex-col gap-y-4 items-start w-2/5 mx-auto mt-10 mb-20">
      <TransferImage />
      <div className="flex flex-col gap-y-6">
        <Heading level="h1" className="text-xl text-zinc-900">
          {id} numaralı sipariş için devir talebi
        </Heading>
        <Text className="text-zinc-600">
          Siparişinizin ({id}) sahipliğinin devredilmesi için bir talep aldınız.
          Bu talebi kabul ediyorsanız aşağıdaki butona tıklayarak devri
          onaylayabilirsiniz.
        </Text>
        <div className="w-full h-px bg-zinc-200" />
        <Text className="text-zinc-600">
          Kabul etmeniz halinde, bu siparişle ilgili tüm sorumluluk ve yetkiler
          yeni sahibine geçer.
        </Text>
        <Text className="text-zinc-600">
          Bu talebi tanımıyorsanız veya sahipliği korumak istiyorsanız herhangi
          bir işlem yapmanıza gerek yoktur.
        </Text>
        <div className="w-full h-px bg-zinc-200" />
        <TransferActions id={id} token={token} />
      </div>
    </div>
  )
}
