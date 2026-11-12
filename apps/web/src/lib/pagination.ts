export type PageItem = number | 'gap';

/**
 * Page numbers to show: always the first and last page, the current one and its
 * neighbours, with 'gap' where pages are skipped. Example (5 of 10): 1 gap 4 5 6 gap 10.
 */
export function pageItems(current: number, totalPages: number, siblings = 1): PageItem[] {
  if (totalPages <= 0) return [];
  const pages = new Set<number>([1, totalPages]);
  for (let p = current - siblings; p <= current + siblings; p++) {
    if (p >= 1 && p <= totalPages) pages.add(p);
  }
  const sorted = [...pages].sort((a, b) => a - b);
  const items: PageItem[] = [];
  sorted.forEach((page, i) => {
    const previous = sorted[i - 1];
    if (previous !== undefined && page - previous === 2) items.push(previous + 1);
    else if (previous !== undefined && page - previous > 2) items.push('gap');
    items.push(page);
  });
  return items;
}

export const totalPages = (total: number, pageSize: number) => Math.max(1, Math.ceil(total / pageSize));
