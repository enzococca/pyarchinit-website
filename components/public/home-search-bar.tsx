"use client";

import { useSearch } from "@/components/public/search-provider";
import { SmartSearchInline } from "@/components/public/smart-search";

export function HomeSearchBar() {
  const { openSearch } = useSearch();
  return <SmartSearchInline onOpen={openSearch} />;
}
