import { z } from 'zod';
import { zodPlugin } from '../main';
import { createField, objectAccessor } from 'roqueform';

describe('zodPlugin', () => {
  const fooType = z.object({
    foo: z.number().gte(3),
  });

  const fooBarType = z.object({
    foo: z.number().min(3),
    bar: z.string().max(2),
  });

  test('enhances the field', () => {
    const field = createField(objectAccessor, { foo: 0 }, zodPlugin(fooType));

    expect(field.invalid).toBe(false);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(false);
    expect(field.at('foo').error).toBe(null);
  });

  test('validates the root field', () => {
    const field = createField(objectAccessor, { foo: 0 }, zodPlugin(fooType));

    field.validate();

    expect(field.invalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(true);
    expect(field.at('foo').error).toEqual({
      code: 'too_small',
      inclusive: true,
      message: 'Number must be greater than or equal to 3',
      minimum: 3,
      path: ['foo'],
      type: 'number',
    });
  });

  test('validates the child field', () => {
    const field = createField(objectAccessor, { foo: 0 }, zodPlugin(fooType));

    field.at('foo').validate();

    expect(field.invalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(true);
    expect(field.at('foo').error).toEqual({
      code: 'too_small',
      inclusive: true,
      message: 'Number must be greater than or equal to 3',
      minimum: 3,
      path: ['foo'],
      type: 'number',
    });
  });

  test('validates multiple fields', () => {
    const field = createField(objectAccessor, { foo: 0, bar: 'qux' }, zodPlugin(fooBarType));

    field.validate();

    expect(field.invalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(true);
    expect(field.at('foo').error).toEqual({
      code: 'too_small',
      inclusive: true,
      message: 'Number must be greater than or equal to 3',
      minimum: 3,
      path: ['foo'],
      type: 'number',
    });

    expect(field.at('bar').invalid).toBe(true);
    expect(field.at('bar').error).toEqual({
      code: 'too_big',
      inclusive: true,
      maximum: 2,
      message: 'String must contain at most 2 character(s)',
      path: ['bar'],
      type: 'string',
    });
  });

  test('does not validate sibling fields', () => {
    const field = createField(objectAccessor, { foo: 0, bar: 'qux' }, zodPlugin(fooBarType));

    field.at('bar').validate();

    expect(field.invalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(false);
    expect(field.at('foo').error).toEqual(null);

    expect(field.at('bar').invalid).toBe(true);
    expect(field.at('bar').error).toEqual({
      code: 'too_big',
      inclusive: true,
      maximum: 2,
      message: 'String must contain at most 2 character(s)',
      path: ['bar'],
      type: 'string',
    });
  });

  test('validates a transient value', () => {
    const field = createField(objectAccessor, { foo: 0, bar: '' }, zodPlugin(fooBarType));

    field.at('bar').setTransientValue('qux');
    field.at('bar').validate();

    expect(field.invalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(false);
    expect(field.at('foo').error).toEqual(null);

    expect(field.at('bar').invalid).toBe(true);
    expect(field.at('bar').error).toEqual({
      code: 'too_big',
      inclusive: true,
      maximum: 2,
      message: 'String must contain at most 2 character(s)',
      path: ['bar'],
      type: 'string',
    });
  });
});
