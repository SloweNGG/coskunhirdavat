import { HttpTypes } from "@medusajs/types"
import Item from "@modules/cart/components/item"

const ItemsTemplate = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const items = [...(cart.items ?? [])].sort((a, b) =>
    (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
  )

  return (
    <ul className="flex flex-col gap-y-4" data-testid="items-table">
      {items.map((item) => (
        <Item key={item.id} item={item} currencyCode={cart.currency_code} />
      ))}
    </ul>
  )
}

export default ItemsTemplate
