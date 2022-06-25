import { renderHook } from '@testing-library/react';
import { useField, withRef } from '../../main';

describe('withRef', () => {
  test('adds ref to the field', () => {
    const hook = renderHook(() => useField(111, withRef()));

    expect(hook.result.current.ref).toEqual({ current: null });
  });
});
