import { describe, expect, it } from 'vitest';
import { pageItems, totalPages } from './pagination';

describe('pageItems', () => {
  it.each([
    [1, 1, [1]],
    [1, 3, [1, 2, 3]],
    [1, 5, [1, 2, 'gap', 5]],
    [3, 5, [1, 2, 3, 4, 5]],
    [5, 10, [1, 'gap', 4, 5, 6, 'gap', 10]],
    [10, 10, [1, 'gap', 9, 10]],
  ])('page %i of %i', (current, total, expected) => {
    expect(pageItems(current, total)).toEqual(expected);
  });

  it('fills a single skipped page instead of showing a gap', () => {
    expect(pageItems(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(pageItems(4, 8)).toEqual([1, 2, 3, 4, 5, 'gap', 8]);
  });

  it('is empty without pages', () => {
    expect(pageItems(1, 0)).toEqual([]);
  });
});

describe('totalPages', () => {
  it('rounds up and never goes below 1', () => {
    expect(totalPages(36, 8)).toBe(5);
    expect(totalPages(0, 20)).toBe(1);
  });
});
