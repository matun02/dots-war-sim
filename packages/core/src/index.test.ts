import { describe, expect, it } from 'vitest';
import { VERSION } from './index.js';

describe('@war-of-dots/core', () => {
  it('exposes a VERSION string', () => {
    expect(typeof VERSION).toBe('string');
  });

  it('starts at 0.0.0', () => {
    expect(VERSION).toBe('0.0.0');
  });
});
