import { renderHook } from '@testing-library/react';
import { Errors, useField, withErrors } from '../../main';

describe('withErrors', () => {
  test('notifies field and errors about the set error', () => {
    const listenerMock = jest.fn();

    const errors = new Errors();

    const hook = renderHook(() => useField(111, withErrors(errors)));
    const field = hook.result.current;

    field.subscribe(listenerMock);

    expect(field.invalid).toBe(false);
    expect(field.error).toBe(undefined);

    field.setError(222);

    expect(errors.get(field)).toBe(222);
    expect(field.invalid).toBe(true);
    expect(field.error).toBe(222);

    expect(listenerMock).toHaveBeenCalledTimes(1);
    expect(listenerMock).toHaveBeenCalledWith(field);
  });

  test('notifies field and errors about the cleared error', () => {
    const listenerMock = jest.fn();

    const errors = new Errors();

    const hook = renderHook(() => useField(111, withErrors(errors)));
    const field = hook.result.current;

    field.setError(222);
    field.subscribe(listenerMock);
    field.clearError();

    expect(errors.has(field)).toBe(false);
    expect(field.invalid).toBe(false);
    expect(field.error).toBe(undefined);

    expect(listenerMock).toHaveBeenCalledTimes(1);
    expect(listenerMock).toHaveBeenCalledWith(field);
  });

  test('notifies field when errors get updated', () => {
    const listenerMock = jest.fn();

    const errors = new Errors();

    const hook = renderHook(() => useField(111, withErrors(errors)));
    const field = hook.result.current;

    field.subscribe(listenerMock);

    errors.set(field, 222);

    expect(field.invalid).toBe(true);
    expect(field.error).toBe(222);

    expect(listenerMock).toHaveBeenCalledTimes(1);
    expect(listenerMock).toHaveBeenCalledWith(field);
  });
});
