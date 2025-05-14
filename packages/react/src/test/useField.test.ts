import { expect, test, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useField } from '../main/index.js';

test('returns field with undefined initial value', () => {
  const hook = renderHook(() => useField());

  expect(hook.result.current.value).toBeUndefined();
});

test('returns a field with a literal initial value', () => {
  const hook = renderHook(() => useField(111));

  expect(hook.result.current.value).toBe(111);
});

test('returns the same field on every render', () => {
  const hook = renderHook(() => useField(111));

  const field = hook.result.current;

  hook.rerender();

  expect(hook.result.current).toBe(field);
});

test('returns a field with an initial value provider', () => {
  const hook = renderHook(() => useField(() => 111));

  expect(hook.result.current.value).toBe(111);
});

test('enhances a field', () => {
  const pluginMock = vi.fn();

  renderHook(() => useField(111, [pluginMock]));

  expect(pluginMock).toHaveBeenCalledTimes(1);
});
