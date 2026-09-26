import { describe, expect, it } from 'vitest';
import { crc32, zip } from './zip';

describe('zip', () => {
  it('computes the standard CRC-32', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
  });

  it('writes each file, a directory of them, and an end record', () => {
    const out = zip([
      { name: 'a.svg', text: '<svg/>' },
      { name: 'b.svg', text: 'hello' },
    ]);
    const view = new DataView(out.buffer);
    expect(view.getUint32(0, true)).toBe(0x04034b50);
    const end = out.length - 22;
    expect(view.getUint32(end, true)).toBe(0x06054b50);
    expect(view.getUint16(end + 10, true)).toBe(2);
    // The directory starts where the end record says, with the first file's entry.
    expect(view.getUint32(view.getUint32(end + 16, true), true)).toBe(0x02014b50);
    expect(new TextDecoder().decode(out.slice(35, 41))).toBe('<svg/>');
  });
});
