import { describe, it, expect } from 'vitest';
import { JsonStore } from '../src/storage/JsonStore.js';

describe('JsonStore Deterministic Serialization', () => {
  it('produces identical output regardless of object key order', () => {
    const objA = {
      z: 1,
      a: 'hello',
      nested: { b: 2, a: 1 },
      arr: [1, 2, { y: 10, x: 5 }]
    };

    const objB = {
      a: 'hello',
      nested: { a: 1, b: 2 },
      z: 1,
      arr: [1, 2, { x: 5, y: 10 }]
    };

    const jsonA = JsonStore.stableStringify(objA);
    const jsonB = JsonStore.stableStringify(objB);

    expect(jsonA).toBe(jsonB);
    expect(jsonA.endsWith('\n')).toBe(true);

    // Verify key ordering in string
    const parsedKeys = Object.keys(JSON.parse(jsonA));
    expect(parsedKeys).toEqual(['a', 'arr', 'nested', 'z']);
  });
});
