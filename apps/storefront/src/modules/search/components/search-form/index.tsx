import { clx } from "@modules/common/components/ui"

type SearchFormProps = {
  countryCode: string
  defaultValue?: string
  className?: string
}

/** Plain GET form so search works without JavaScript and for browser agents. */
const SearchForm = ({ countryCode, defaultValue, className }: SearchFormProps) => (
  <form
    role="search"
    method="get"
    action={`/${countryCode}/search`}
    className={clx(
      "flex h-12 items-center rounded-full border border-brand/25 bg-brand-50 p-1 pl-5 transition-[background-color,border-color,box-shadow] duration-150 hover:border-brand/50 focus-within:border-brand focus-within:bg-white focus-within:ring-4 focus-within:ring-brand/15",
      className
    )}
    {...{
      toolname: "search_products",
      tooldescription: "Search the store's products by keyword",
    }}
  >
    <label htmlFor="search-q" className="sr-only">
      Ürün ara
    </label>
    <input
      id="search-q"
      type="search"
      name="q"
      defaultValue={defaultValue}
      placeholder="Ürün, kategori veya model kodu ara..."
      className="h-full min-w-0 flex-1 bg-transparent pr-3 text-[15px] text-navy outline-none placeholder:text-muted"
    />
    <button
      type="submit"
      className="flex h-full shrink-0 items-center rounded-full bg-brand px-5 text-sm font-semibold text-brand-fg shadow-sm transition-colors hover:bg-brand-dark"
    >
      Ara
    </button>
  </form>
)

export default SearchForm
