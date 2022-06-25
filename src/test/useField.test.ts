import { renderHook } from '@testing-library/react-hooks/native';
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
    let field0;
    const enhancerMock = jest.fn(field => (field0 = Object.assign({}, field)));

    const hook = renderHook(() => useField(111, enhancerMock));

    expect(hook.result.current).toBe(field0);
    expect(enhancerMock).toHaveBeenCalledTimes(1);
  });
});
