"use client";

import { IngredientSearch } from "@/components/search/ingredient-search";

export function HeaderSearch() {
  return (
    <div className="hidden flex-1 justify-center px-4 md:flex md:max-w-md lg:max-w-lg">
      <IngredientSearch variant="compact" />
    </div>
  );
}
