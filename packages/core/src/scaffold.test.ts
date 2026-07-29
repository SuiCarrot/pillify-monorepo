import { describe, expect, it } from 'vitest';

describe('@pillify/core scaffold', () => {
  it('runs without browser DOM globals', () => {
    expect('document' in globalThis).toBe(false);
    expect('localStorage' in globalThis).toBe(false);
    expect(1 + 1).toBe(2);
  });
});
