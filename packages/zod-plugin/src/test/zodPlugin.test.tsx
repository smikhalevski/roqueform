import { z, ZodErrorMap, ZodIssue, ZodIssueCode } from 'zod';
import { zodPlugin } from '../main';
import { createField } from 'roqueform';

describe('zodPlugin', () => {
  const fooType = z.object({
    foo: z.number().gte(3),
  });

  const fooBarType = z.object({
    foo: z.number().min(3),
    bar: z.string().max(2),
  });

  test('enhances the field', () => {
    const field = createField({ foo: 0 }, zodPlugin(fooType));

    expect(field.isInvalid).toBe(false);
    expect(field.error).toBe(null);

    expect(field.at('foo').isInvalid).toBe(false);
    expect(field.at('foo').error).toBe(null);
  });

  test('converts string errors to issue messages', () => {
    const field = createField({ foo: 0 }, zodPlugin(fooType));

    field.setError('aaa');

    expect(field.error).toEqual({ code: ZodIssueCode.custom, message: 'aaa', path: [] });
  });

  test('sets issue as an error', () => {
    const field = createField({ foo: 0 }, zodPlugin(fooType));

    const issue: ZodIssue = { code: ZodIssueCode.custom, path: ['bbb'], message: 'aaa' };

    field.at('foo').setError(issue);

    expect(field.at('foo').error).toBe(issue);
    expect(field.at('foo').error).toEqual({ code: ZodIssueCode.custom, message: 'aaa', path: ['bbb'] });
  });

  test('validates the root field', () => {
    const field = createField({ foo: 0 }, zodPlugin(fooType));

    field.validate();

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').isInvalid).toBe(true);
    expect(field.at('foo').error).toEqual({
      code: 'too_small',
      exact: false,
      inclusive: true,
      message: 'Number must be greater than or equal to 3',
      minimum: 3,
      path: ['foo'],
      type: 'number',
    });
  });

  test('validates the child field', () => {
    const field = createField({ foo: 0 }, zodPlugin(fooType));

    field.at('foo').validate();

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').isInvalid).toBe(true);
    expect(field.at('foo').error).toEqual({
      code: 'too_small',
      exact: false,
      inclusive: true,
      message: 'Number must be greater than or equal to 3',
      minimum: 3,
      path: ['foo'],
      type: 'number',
    });
  });

  test('validates multiple fields', () => {
    const field = createField({ foo: 0, bar: 'qux' }, zodPlugin(fooBarType));

    field.validate();

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').isInvalid).toBe(true);
    expect(field.at('foo').error).toEqual({
      code: 'too_small',
      exact: false,
      inclusive: true,
      message: 'Number must be greater than or equal to 3',
      minimum: 3,
      path: ['foo'],
      type: 'number',
    });

    expect(field.at('bar').isInvalid).toBe(true);
    expect(field.at('bar').error).toEqual({
      code: 'too_big',
      exact: false,
      inclusive: true,
      maximum: 2,
      message: 'String must contain at most 2 character(s)',
      path: ['bar'],
      type: 'string',
    });
  });

  test('does not validate sibling fields', () => {
    const field = createField({ foo: 0, bar: 'qux' }, zodPlugin(fooBarType));

    field.at('bar').validate();

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').isInvalid).toBe(false);
    expect(field.at('foo').error).toEqual(null);

    expect(field.at('bar').isInvalid).toBe(true);
    expect(field.at('bar').error).toEqual({
      code: 'too_big',
      exact: false,
      inclusive: true,
      maximum: 2,
      message: 'String must contain at most 2 character(s)',
      path: ['bar'],
      type: 'string',
    });
  });

  test('validates a transient value', () => {
    const field = createField({ foo: 0, bar: '' }, zodPlugin(fooBarType));

    field.at('bar').setTransientValue('qux');
    field.at('bar').validate();

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').isInvalid).toBe(false);
    expect(field.at('foo').error).toEqual(null);

    expect(field.at('bar').isInvalid).toBe(true);
    expect(field.at('bar').error).toEqual({
      code: 'too_big',
      exact: false,
      inclusive: true,
      maximum: 2,
      message: 'String must contain at most 2 character(s)',
      path: ['bar'],
      type: 'string',
    });
  });

  test('uses errorMap passed to createField', () => {
    const errorMapMock: ZodErrorMap = jest.fn(() => {
      return { message: 'aaa' };
    });

    const field = createField({ foo: 0, bar: '' }, zodPlugin(fooBarType, errorMapMock));

    field.validate();

    expect(errorMapMock).toHaveBeenCalledTimes(1);

    expect(field.at('foo').isInvalid).toBe(true);
    expect(field.at('foo').error).toEqual({
      code: 'too_small',
      exact: false,
      inclusive: true,
      message: 'aaa',
      minimum: 3,
      path: ['foo'],
      type: 'number',
    });
  });

  test('uses errorMap passed to validate method', () => {
    const errorMapMock: ZodErrorMap = jest.fn(() => {
      return { message: 'aaa' };
    });

    const field = createField({ foo: 0, bar: '' }, zodPlugin(fooBarType));

    field.validate({ errorMap: errorMapMock });

    expect(errorMapMock).toHaveBeenCalledTimes(1);

    expect(field.at('foo').isInvalid).toBe(true);
    expect(field.at('foo').error).toEqual({
      code: 'too_small',
      exact: false,
      inclusive: true,
      message: 'aaa',
      minimum: 3,
      path: ['foo'],
      type: 'number',
    });
  });
});
