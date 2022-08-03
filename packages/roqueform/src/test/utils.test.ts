import { callOrGet } from '../main/utils';

describe('callOrGet', () => {
  test('returns non function value as is', () => {
    const obj = {};

    expect(callOrGet(123)).toBe(123);
    expect(callOrGet(null)).toBe(null);
    expect(callOrGet(obj)).toBe(obj);
  });

  test('returns the function call result', () => {
    expect(callOrGet(() => 123)).toBe(123);
  });

  test('passes arguments to a function', () => {
    expect(callOrGet((arg1, arg2) => arg1 + arg2, 123, 456)).toBe(579);
  });
});
