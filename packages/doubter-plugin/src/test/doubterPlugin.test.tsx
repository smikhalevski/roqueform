import { act, renderHook } from '@testing-library/react';
import { number, object, string } from 'doubter';
import { useField } from 'roqueform';
import { doubterPlugin } from '../main';

describe('doubterPlugin', () => {
  test('validates the root field', () => {
    const type = object({
      foo: number().gte(3),
    });

    const hook = renderHook(() => useField({ foo: 0 }, doubterPlugin(type)));

    const field = hook.result.current;

    act(() => field.validate());

    expect(field.error).toBe(null);

    expect(field.at('foo').error).toEqual({
      code: 'numberGreaterThanOrEqual',
      value: 0,
      param: 3,
      message: 'Must be greater than or equal to 3',
      meta: undefined,
    });
  });

  test('validates the child field', () => {
    const type = object({
      foo: number().gte(3),
    });

    const hook = renderHook(() => useField({ foo: 0 }, doubterPlugin(type)));

    const field = hook.result.current;

    act(() => field.at('foo').validate());

    expect(field.error).toBe(null);

    expect(field.at('foo').error).toEqual({
      code: 'numberGreaterThanOrEqual',
      value: 0,
      param: 3,
      message: 'Must be greater than or equal to 3',
      meta: undefined,
    });
  });

  test('validates multiple fields', () => {
    const type = object({
      foo: number().gte(3),
      bar: string().length(3),
    });

    const hook = renderHook(() => useField({ foo: 0, bar: '' }, doubterPlugin(type)));

    const field = hook.result.current;

    act(() => field.at('foo').validate());

    expect(field.error).toBe(null);

    expect(field.at('foo').error).toEqual({
      code: 'numberGreaterThanOrEqual',
      value: 0,
      param: 3,
      message: 'Must be greater than or equal to 3',
      meta: undefined,
    });

    expect(field.at('bar').error).toEqual({
      code: 'stringMinLength',
      value: '',
      param: 3,
      message: 'Must have the minimum length of 3',
      meta: undefined,
    });
  });

  test('clear an error after successful validation', () => {
    const type = object({
      foo: number().gte(3),
    });

    const hook = renderHook(() => useField({ foo: 0 }, doubterPlugin(type)));

    const field = hook.result.current;

    act(() => {
      field.at('foo').validate();
      field.at('foo').dispatchValue(5);
      field.at('foo').validate();
    });

    expect(field.at('foo').error).toBe(null);
  });

  test('does not clear the unknown error', () => {
    const type = object({
      foo: number().gte(3),
    });

    const hook = renderHook(() => useField({ foo: 0 }, doubterPlugin(type)));

    const field = hook.result.current;

    act(() => {
      field.at('foo').validate();
      field.at('foo').dispatchValue(5);
      field.at('foo').setError({ code: 'qux' });
      field.at('foo').validate();
    });

    expect(field.at('foo').error).toEqual({ code: 'qux' });
  });
});
