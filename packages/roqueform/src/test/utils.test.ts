import { expect, test } from 'vitest';
import { callOrGet } from '../main/utils.js';

test('returns non function value as is', () => {
  const obj = {};

  expect(callOrGet(111, undefined)).toBe(111);
  expect(callOrGet(null, undefined)).toBeNull();
  expect(callOrGet(obj, undefined)).toBe(obj);
});

test('returns the function call result', () => {
  expect(callOrGet(() => 111, undefined)).toBe(111);
});

test('passes arguments to a function', () => {
  expect(callOrGet(arg => arg, 111)).toBe(111);
});
