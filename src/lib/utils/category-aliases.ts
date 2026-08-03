import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/constants/config";

const DEFAULT_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

/**
 * Build a map from any known category string → all equivalent aliases.
 * Handles default value/label pairs and optional user overrides (renamed defaults).
 */
export function buildCategoryAliasMap(
  overrides: Array<{ name: string; default_key?: string | null }> = []
): Map<string, string[]> {
  const groups = new Map<string, Set<string>>();

  const addGroup = (canonical: string, aliases: string[]) => {
    const existing = groups.get(canonical) ?? new Set<string>();
    for (const alias of aliases) {
      if (alias) existing.add(alias);
    }
    groups.set(canonical, existing);
  };

  for (const category of DEFAULT_CATEGORIES) {
    addGroup(category.value, [category.value, category.label]);
  }

  for (const override of overrides) {
    if (!override.default_key) {
      addGroup(override.name, [override.name]);
      continue;
    }

    const [, value] = override.default_key.split(":");
    const defaults = DEFAULT_CATEGORIES.find((item) => item.value === value);
    addGroup(value || override.name, [
      value,
      defaults?.value,
      defaults?.label,
      override.name,
    ].filter((item): item is string => Boolean(item)));
  }

  const aliasMap = new Map<string, string[]>();
  for (const aliases of groups.values()) {
    const list = Array.from(aliases);
    for (const alias of list) {
      const merged = new Set([...(aliasMap.get(alias) ?? []), ...list]);
      aliasMap.set(alias, Array.from(merged));
    }
  }

  return aliasMap;
}

export function getCategoryAliases(
  category: string,
  aliasMap?: Map<string, string[]>
): string[] {
  const fromMap = aliasMap?.get(category);
  if (fromMap?.length) return fromMap;

  const match = DEFAULT_CATEGORIES.find(
    (item) => item.value === category || item.label === category
  );
  if (match) return [match.value, match.label];

  return [category];
}

export function getCanonicalCategory(
  category: string,
  aliasMap?: Map<string, string[]>
): string {
  const aliases = getCategoryAliases(category, aliasMap);
  const match = DEFAULT_CATEGORIES.find(
    (item) => aliases.includes(item.value) || aliases.includes(item.label)
  );
  return match?.value ?? aliases[0] ?? category;
}

export function getCategoryDisplayName(category: string): string {
  const match = DEFAULT_CATEGORIES.find(
    (item) => item.value === category || item.label === category
  );
  return match?.label ?? category;
}

/** Canonical key used when creating budgets for a default category. */
export function getBudgetCategoryKey(category: string): string {
  return getCanonicalCategory(category);
}
