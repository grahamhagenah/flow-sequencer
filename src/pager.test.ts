import { describe, expect, it } from 'vitest';
import { pagesToShow } from './Builder';

const show = (count: number, current: number) =>
  pagesToShow(count, current).map((p) => (p === null ? '…' : p + 1)).join(' ');

describe('page numbers', () => {
  it('lists every page when there are few', () => {
    expect(show(5, 0)).toBe('1 2 3 4 5');
    expect(show(7, 6)).toBe('1 2 3 4 5 6 7');
  });

  it('keeps the first, the last and the current page’s neighbours when there are many', () => {
    expect(show(15, 7)).toBe('1 … 7 8 9 … 15');
    expect(show(15, 0)).toBe('1 2 … 15');
    expect(show(15, 1)).toBe('1 2 3 … 15');
    expect(show(15, 14)).toBe('1 … 14 15');
    expect(show(15, 2)).toBe('1 2 3 4 … 15');
  });
});
