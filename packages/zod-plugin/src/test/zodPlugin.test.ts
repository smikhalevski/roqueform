import { describe, expect, test, vi } from 'vitest';
import { z, ZodErrorMap, ZodIssue, ZodIssueCode } from 'zod';
import zodPlugin from '../main/index.js';
import { createField } from 'roqueform';
import errorsPlugin from 'roqueform/plugin/errors';

describe('zodPlugin', () => {
  const aaaType = z.object({
    aaa: z.number().gte(3),
  });

  const aaaBbbType = z.object({
    aaa: z.number().min(3),
    bbb: z.string().max(2),
  });

  test('enhances the field', () => {
    const field = createField({ aaa: 111 }, [errorsPlugin<z.ZodIssue>(), zodPlugin(aaaType)]);

    expect(field.isInvalid).toBe(false);
    expect(field.errors.length).toBe(0);

    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').errors.length).toBe(0);
  });

  test('adds an issue', () => {
    const field = createField({ aaa: 111 }, [errorsPlugin<z.ZodIssue>(), zodPlugin(aaaType)]);

    const issue: ZodIssue = { code: ZodIssueCode.custom, path: ['bbb'], message: 'aaa' };

    field.at('aaa').addError(issue);

    expect(field.at('aaa').errors[0]).toBe(issue);
    expect(field.at('aaa').errors.length).toBe(1);
  });

  test('validates the root field', () => {
    const field = createField({ aaa: 0 }, [errorsPlugin<z.ZodIssue>(), zodPlugin(aaaType)]);

    field.validate();

    expect(field.isInvalid).toBe(false);
    expect(field.errors.length).toBe(0);

    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').errors).toEqual([
      {
        code: 'too_small',
        exact: false,
        inclusive: true,
        message: 'Number must be greater than or equal to 3',
        minimum: 3,
        path: ['aaa'],
        type: 'number',
      },
    ]);
  });

  test('validates the child field', () => {
    const field = createField({ aaa: 0 }, [errorsPlugin<z.ZodIssue>(), zodPlugin(aaaType)]);

    field.at('aaa').validate();

    expect(field.isInvalid).toBe(false);
    expect(field.errors.length).toBe(0);

    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').errors).toEqual([
      {
        code: 'too_small',
        exact: false,
        inclusive: true,
        message: 'Number must be greater than or equal to 3',
        minimum: 3,
        path: ['aaa'],
        type: 'number',
      },
    ]);
  });

  test('validates multiple fields', () => {
    const field = createField({ aaa: 0, bbb: 'ccc' }, [errorsPlugin<z.ZodIssue>(), zodPlugin(aaaBbbType)]);

    field.validate();

    expect(field.isInvalid).toBe(false);
    expect(field.errors.length).toBe(0);

    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').errors).toEqual([
      {
        code: 'too_small',
        exact: false,
        inclusive: true,
        message: 'Number must be greater than or equal to 3',
        minimum: 3,
        path: ['aaa'],
        type: 'number',
      },
    ]);

    expect(field.at('bbb').isInvalid).toBe(true);
    expect(field.at('bbb').errors).toEqual([
      {
        code: 'too_big',
        exact: false,
        inclusive: true,
        maximum: 2,
        message: 'String must contain at most 2 character(s)',
        path: ['bbb'],
        type: 'string',
      },
    ]);
  });

  test('does not validate sibling fields', () => {
    const field = createField({ aaa: 111, bbb: 'ccc' }, [errorsPlugin<z.ZodIssue>(), zodPlugin(aaaBbbType)]);

    field.at('bbb').validate();

    expect(field.isInvalid).toBe(false);
    expect(field.errors.length).toBe(0);

    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').errors.length).toBe(0);

    expect(field.at('bbb').isInvalid).toBe(true);
    expect(field.at('bbb').errors).toEqual([
      {
        code: 'too_big',
        exact: false,
        inclusive: true,
        maximum: 2,
        message: 'String must contain at most 2 character(s)',
        path: ['bbb'],
        type: 'string',
      },
    ]);
  });

  test('validates a transient value', () => {
    const field = createField({ aaa: 111, bbb: '' }, [errorsPlugin<z.ZodIssue>(), zodPlugin(aaaBbbType)]);

    field.at('bbb').setTransientValue('ccc');
    field.at('bbb').validate();

    expect(field.isInvalid).toBe(false);
    expect(field.errors.length).toBe(0);

    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').errors.length).toBe(0);

    expect(field.at('bbb').isInvalid).toBe(true);
    expect(field.at('bbb').errors).toEqual([
      {
        code: 'too_big',
        exact: false,
        inclusive: true,
        maximum: 2,
        message: 'String must contain at most 2 character(s)',
        path: ['bbb'],
        type: 'string',
      },
    ]);
  });

  test('uses errorMap passed to validate method', () => {
    const errorMapMock: ZodErrorMap = vi.fn(() => {
      return { message: 'aaa' };
    });

    const field = createField({ aaa: 0, bbb: '' }, [errorsPlugin<z.ZodIssue>(), zodPlugin(aaaBbbType)]);

    field.validate({ errorMap: errorMapMock });

    expect(errorMapMock).toHaveBeenCalledTimes(1);

    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').errors).toEqual([
      {
        code: 'too_small',
        exact: false,
        inclusive: true,
        message: 'aaa',
        minimum: 3,
        path: ['aaa'],
        type: 'number',
      },
    ]);
  });
});
