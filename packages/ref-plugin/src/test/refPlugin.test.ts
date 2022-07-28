import { renderHook } from '@testing-library/react';
import { useField } from 'roqueform';
import { refPlugin } from '../main';

describe('refPlugin', () => {
  test('adds ref property to the field', () => {
    const hook = renderHook(() => useField(111, refPlugin()));

    expect(hook.result.current.ref).toEqual({ current: null });
  });
});
