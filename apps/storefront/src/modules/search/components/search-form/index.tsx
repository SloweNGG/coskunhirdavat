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
    className={clx("flex gap-2", className)}
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
      placeholder="Ürün, marka veya kategori ara..."
      className="flex-1 h-11 px-4 border-2 rounded-lg border-brand bg-white txt-compact-medium"
    />
    <button
      type="submit"
      className="h-11 px-5 rounded-lg bg-brand font-semibold text-brand-fg hover:bg-brand-dark"
    >
      Ara
    </button>
  </form>
)

export default SearchForm
