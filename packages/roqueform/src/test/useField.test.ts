import { renderHook } from '@testing-library/react';
import { useField } from '../main';

describe('useField', () => {
  test('returns field with undefined initial value', () => {
    const hook = renderHook(() => useField());

    expect(hook.result.current.getValue()).toBe(undefined);
  });

  test('returns a filed with a literal initial value', () => {
    const hook = renderHook(() => useField(111));

    expect(hook.result.current.getValue()).toBe(111);
  });

  test('returns the same field on every render', () => {
    const hook = renderHook(() => useField(111));

    const field = hook.result.current;

    hook.rerender();

    expect(hook.result.current).toBe(field);
  });

  test('returns a filed with an initial value provider', () => {
    const hook = renderHook(() => useField(() => 111));

    expect(hook.result.current.getValue()).toBe(111);
  });

  test('enhances a field', () => {
    let field0;
    const pluginMock = jest.fn(field => (field0 = Object.assign({}, field)));

    const hook = renderHook(() => useField(111, pluginMock));

    expect(hook.result.current).toBe(field0);
    expect(pluginMock).toHaveBeenCalledTimes(1);
  });
});
