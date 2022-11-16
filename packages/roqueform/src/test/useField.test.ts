import { renderHook } from '@testing-library/react';
import { useField } from '../main';

describe('useField', () => {
  test('returns field with undefined initial value', () => {
    const hook = renderHook(() => useField());

    expect(hook.result.current.value).toBe(undefined);
  });

  test('returns a filed with a literal initial value', () => {
    const hook = renderHook(() => useField(111));

    expect(hook.result.current.value).toBe(111);
  });

  test('returns the same field on every render', () => {
    const hook = renderHook(() => useField(111));

    const field = hook.result.current;

    hook.rerender();

    expect(hook.result.current).toBe(field);
  });

  test('returns a filed with an initial value provider', () => {
    const hook = renderHook(() => useField(() => 111));

    expect(hook.result.current.value).toBe(111);
  });

  test('enhances a field', () => {
    let fieldClone;
    const pluginMock = jest.fn(field => (fieldClone = Object.assign({}, field)));

    const hook = renderHook(() => useField(111, pluginMock));

    expect(hook.result.current).toBe(fieldClone);
    expect(pluginMock).toHaveBeenCalledTimes(1);
  });
});
