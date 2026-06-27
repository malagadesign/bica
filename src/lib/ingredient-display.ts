type IngredientLike = {
  inci_name?: string | null;
  chemical_name?: string | null;
  color_index?: string | null;
  cas_number?: string | null;
};

export function getIngredientDisplayName(ingredient: IngredientLike): string {
  if (ingredient.inci_name?.trim()) return ingredient.inci_name.trim();
  if (ingredient.chemical_name?.trim()) return ingredient.chemical_name.trim();
  if (ingredient.color_index?.trim()) {
    return `CI ${ingredient.color_index.trim()}`;
  }
  if (ingredient.cas_number?.trim()) return ingredient.cas_number.trim();
  return "Sin nombre";
}

export function formatRuleStatus(status: string): string {
  return status.replace(/_/g, " ");
}
