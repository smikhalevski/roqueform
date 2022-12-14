import { renderHook } from '@testing-library/react';
import { useField } from '../main';

describe('useField', () => {
  test('returns field with undefined initial value', () => {
    const hook = renderHook(() => useField());

    expect(hook.result.current.value).toBe(undefined);
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
    const pluginMock = jest.fn();

    renderHook(() => useField(111, pluginMock));

    expect(pluginMock).toHaveBeenCalledTimes(1);
  });

  test('re-creates a field when deps are changed', () => {
    let depsMock = [111];
    const pluginMock = jest.fn();

    const hook = renderHook(() => useField(111, pluginMock, depsMock));

    const field = hook.result.current;
    depsMock = [222];
    hook.rerender();

    expect(hook.result.current).not.toBe(field);
  });
});
