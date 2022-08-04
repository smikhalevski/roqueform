import * as d from 'doubter';
import { doubterPlugin } from '../main';
import { createField, objectAccessor } from 'roqueform/src/main';

describe('doubterPlugin', () => {
  test('', () => {
    const type = d.object({
      foo: d.string().min(5),
    });

    const field = createField(objectAccessor, { foo: 'aaa' }, doubterPlugin(type));

    const fooField = field.at('foo');
  });

  // test('validates the root field', () => {
  //   const type = object({
  //     foo: number().gte(3),
  //   });
  //
  //   const hook = renderHook(() => useField({ foo: 0 }, doubterPlugin(type)));
  //
  //   const field = hook.result.current;
  //
  //   act(() => field.validate());
  //
  //   expect(field.getIssue()).toBe(null);
  //
  //   expect(field.at('foo').getIssue()).toEqual({
  //     code: 'numberGreaterThanOrEqual',
  //     value: 0,
  //     param: 3,
  //     message: 'Must be greater than or equal to 3',
  //     meta: undefined,
  //   });
  // });
  //
  // test('validates the child field', () => {
  //   const type = object({
  //     foo: number().gte(3),
  //   });
  //
  //   const hook = renderHook(() => useField({ foo: 0 }, doubterPlugin(type)));
  //
  //   const field = hook.result.current;
  //
  //   act(() => field.at('foo').validate());
  //
  //   expect(field.getIssue()).toBe(null);
  //
  //   expect(field.at('foo').getIssue()).toEqual({
  //     code: 'numberGreaterThanOrEqual',
  //     value: 0,
  //     param: 3,
  //     message: 'Must be greater than or equal to 3',
  //     meta: undefined,
  //   });
  // });
  //
  // test('validates multiple fields', () => {
  //   const type = object({
  //     foo: number().gte(3),
  //     bar: string().length(3),
  //   });
  //
  //   const hook = renderHook(() => useField({ foo: 0, bar: '' }, doubterPlugin(type)));
  //
  //   const field = hook.result.current;
  //
  //   act(() => field.at('foo').validate());
  //
  //   expect(field.getIssue()).toBe(null);
  //
  //   expect(field.at('foo').getIssue()).toEqual({
  //     code: 'numberGreaterThanOrEqual',
  //     value: 0,
  //     param: 3,
  //     message: 'Must be greater than or equal to 3',
  //     meta: undefined,
  //   });
  //
  //   expect(field.at('bar').getIssue()).toEqual({
  //     code: 'stringMinLength',
  //     value: '',
  //     param: 3,
  //     message: 'Must have the minimum length of 3',
  //     meta: undefined,
  //   });
  // });
  //
  // test('clear an error after successful validation', () => {
  //   const type = object({
  //     foo: number().gte(3),
  //   });
  //
  //   const hook = renderHook(() => useField({ foo: 0 }, doubterPlugin(type)));
  //
  //   const field = hook.result.current;
  //
  //   act(() => {
  //     field.at('foo').validate();
  //     field.at('foo').dispatchValue(5);
  //     field.at('foo').validate();
  //   });
  //
  //   expect(field.at('foo').getIssue()).toBe(null);
  // });
  //
  // test('does not clear the unknown error', () => {
  //   const type = object({
  //     foo: number().gte(3),
  //   });
  //
  //   const hook = renderHook(() => useField({ foo: 0 }, doubterPlugin(type)));
  //
  //   const field = hook.result.current;
  //
  //   act(() => {
  //     field.at('foo').validate();
  //     field.at('foo').dispatchValue(5);
  //     field.at('foo').setIssue({ code: 'qux' });
  //     field.at('foo').validate();
  //   });
  //
  //   expect(field.at('foo').getIssue()).toEqual({ code: 'qux' });
  // });
});
