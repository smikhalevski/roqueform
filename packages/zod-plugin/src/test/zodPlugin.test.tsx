import { z, ZodErrorMap, ZodIssue, ZodIssueCode } from 'zod';
import { zodPlugin } from '../main';
import { createField } from 'roqueform';

describe('zodPlugin', () => {
  const aaaType = z.object({
    aaa: z.number().gte(3),
  });

  const aaaBbbType = z.object({
    aaa: z.number().min(3),
    bbb: z.string().max(2),
  });

  test('enhances the field', () => {
    const field = createField({ aaa: 111 }, zodPlugin(aaaType));

    expect(field.isInvalid).toBe(false);
    expect(field.error).toBeNull();

    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').error).toBeNull();
  });

  test('converts string errors to issue messages', () => {
    const field = createField({ aaa: 111 }, zodPlugin(aaaType));

    field.setError('xxx');

    expect(field.error).toEqual({ code: ZodIssueCode.custom, message: 'xxx', path: [] });
  });

  test('sets issue as an error', () => {
    const field = createField({ aaa: 111 }, zodPlugin(aaaType));

    const issue: ZodIssue = { code: ZodIssueCode.custom, path: ['bbb'], message: 'aaa' };

    field.at('aaa').setError(issue);

    expect(field.at('aaa').error).toBe(issue);
    expect(field.at('aaa').error).toEqual({ code: ZodIssueCode.custom, message: 'aaa', path: ['bbb'] });
  });

  test('validates the root field', () => {
    const field = createField({ aaa: 0 }, zodPlugin(aaaType));

    field.validate();

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBeNull();

    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').error).toEqual({
      code: 'too_small',
      exact: false,
      inclusive: true,
      message: 'Number must be greater than or equal to 3',
      minimum: 3,
      path: ['aaa'],
      type: 'number',
    });
  });

  test('validates the child field', () => {
    const field = createField({ aaa: 0 }, zodPlugin(aaaType));

    field.at('aaa').validate();

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBeNull();

    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').error).toEqual({
      code: 'too_small',
      exact: false,
      inclusive: true,
      message: 'Number must be greater than or equal to 3',
      minimum: 3,
      path: ['aaa'],
      type: 'number',
    });
  });

  test('validates multiple fields', () => {
    const field = createField({ aaa: 0, bbb: 'ccc' }, zodPlugin(aaaBbbType));

    field.validate();

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBeNull();

    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').error).toEqual({
      code: 'too_small',
      exact: false,
      inclusive: true,
      message: 'Number must be greater than or equal to 3',
      minimum: 3,
      path: ['aaa'],
      type: 'number',
    });

    expect(field.at('bbb').isInvalid).toBe(true);
    expect(field.at('bbb').error).toEqual({
      code: 'too_big',
      exact: false,
      inclusive: true,
      maximum: 2,
      message: 'String must contain at most 2 character(s)',
      path: ['bbb'],
      type: 'string',
    });
  });

  test('does not validate sibling fields', () => {
    const field = createField({ aaa: 111, bbb: 'ccc' }, zodPlugin(aaaBbbType));

    field.at('bbb').validate();

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBeNull();

    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').error).toEqual(null);

    expect(field.at('bbb').isInvalid).toBe(true);
    expect(field.at('bbb').error).toEqual({
      code: 'too_big',
      exact: false,
      inclusive: true,
      maximum: 2,
      message: 'String must contain at most 2 character(s)',
      path: ['bbb'],
      type: 'string',
    });
  });

  test('validates a transient value', () => {
    const field = createField({ aaa: 111, bbb: '' }, zodPlugin(aaaBbbType));

    field.at('bbb').setTransientValue('ccc');
    field.at('bbb').validate();

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBeNull();

    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').error).toEqual(null);

    expect(field.at('bbb').isInvalid).toBe(true);
    expect(field.at('bbb').error).toEqual({
      code: 'too_big',
      exact: false,
      inclusive: true,
      maximum: 2,
      message: 'String must contain at most 2 character(s)',
      path: ['bbb'],
      type: 'string',
    });
  });

  test('uses errorMap passed to validate method', () => {
    const errorMapMock: ZodErrorMap = jest.fn(() => {
      return { message: 'aaa' };
    });

    const field = createField({ aaa: 0, bbb: '' }, zodPlugin(aaaBbbType));

    field.validate({ errorMap: errorMapMock });

    expect(errorMapMock).toHaveBeenCalledTimes(1);

    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').error).toEqual({
      code: 'too_small',
      exact: false,
      inclusive: true,
      message: 'aaa',
      minimum: 3,
      path: ['aaa'],
      type: 'number',
    });
  });
});
