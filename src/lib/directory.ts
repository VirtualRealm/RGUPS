// Search treats Russian е/ё, punctuation and whitespace consistently.
export function searchText(value: string) {
  return value
    .toLocaleLowerCase("ru-RU")
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
export function matchesQuery(value: string, query: string) {
  const haystack = searchText(value);
  return searchText(query)
    .split(" ")
    .filter(Boolean)
    .every((token) => haystack.includes(token));
}
export function paginate<T>(items: T[], page: number, size = 20) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, page), pages);
  return {
    items: items.slice((current - 1) * size, current * size),
    pages,
    current,
  };
}
