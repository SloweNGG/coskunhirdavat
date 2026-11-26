"use client"

import { MagnifyingGlass } from "@medusajs/icons"
import Link from "next/link"
import { useParams } from "next/navigation"

import useToggleState from "@lib/hooks/use-toggle-state"
import SearchBox, { type SearchCategory } from "./search-box"
import SearchDrawer from "./drawer"

export type { SearchCategory }

type SearchProps = {
  categories: SearchCategory[]
  currencyCode: string
  /** "bar": the desktop header field. "icon": a button opening the mobile drawer. */
  variant?: "icon" | "bar"
}

const Search = ({ variant = "icon", ...props }: SearchProps) =>
  variant === "bar" ? <SearchBox {...props} /> : <SearchIcon {...props} />

const SearchIcon = (props: Omit<SearchProps, "variant">) => {
  const { state: isOpen, open, close } = useToggleState()
  const { countryCode } = useParams<{ countryCode: string }>()

  return (
    <>
      {/* A real link so search works without JavaScript; with JS it opens the drawer instead. */}
      <Link
        href={`/${countryCode}/search`}
        onClick={(event) => {
          event.preventDefault()
          open()
        }}
        aria-label="Ürün ara"
        className="flex items-center text-navy hover:text-brand-ink"
        data-testid="nav-search-button"
      >
        <MagnifyingGlass className="h-6 w-6" />
      </Link>

      <SearchDrawer isOpen={isOpen} close={close}>
        <SearchBox {...props} variant="sheet" onNavigate={close} />
      </SearchDrawer>
    </>
  )
}

export default Search
