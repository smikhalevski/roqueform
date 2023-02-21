import * as d from 'doubter';
import { doubterPlugin } from '../main';
import { createField } from 'roqueform';

describe('doubterPlugin', () => {
  const fooShape = d.object({
    foo: d.number().gte(3),
  });

  const fooBarShape = d.object({
    foo: d.number().gte(3),
    bar: d.string().max(2),
  });

  test('enhances the field', () => {
    const field = createField({ foo: 0 }, doubterPlugin(fooShape));

    expect(field.invalid).toBe(false);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(false);
    expect(field.at('foo').error).toBe(null);
  });

  test('sets an issue to the root field', () => {
    const field = createField({ foo: 0 }, doubterPlugin(fooShape));

    const issue = { code: 'aaa' };

    field.setError(issue);

    expect(field.invalid).toBe(true);
    expect(field.error).toBe(issue);
    expect(field.error).toEqual({ code: 'aaa', input: { foo: 0 }, path: [] });

    expect(field.at('foo').invalid).toBe(false);
    expect(field.at('foo').error).toBe(null);
  });

  test('sets an issue to the child field', () => {
    const field = createField({ foo: 0 }, doubterPlugin(fooShape));

    const issue = { code: 'aaa' };

    field.at('foo').setError(issue);

    expect(field.invalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(true);
    expect(field.at('foo').error).toBe(issue);
    expect(field.at('foo').error).toEqual({ code: 'aaa', input: 0, path: ['foo'] });
  });

  test('converts string errors to issue messages', () => {
    const field = createField({ foo: 0 }, doubterPlugin(fooShape));

    field.at('foo').setError('aaa');

    expect(field.invalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(true);
    expect(field.at('foo').error).toEqual({ code: 'unknown', message: 'aaa', input: 0, path: ['foo'] });
  });

  test('deletes an issue from the root field', () => {
    const field = createField({ foo: 0 }, doubterPlugin(fooShape));

    field.setError({ code: 'aaa' });
    field.deleteError();

    expect(field.invalid).toBe(false);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(false);
    expect(field.at('foo').error).toBe(null);
  });

  test('deletes an issue from the child field', () => {
    const field = createField({ foo: 0 }, doubterPlugin(fooShape));

    field.at('foo').setError({ code: 'aaa' });
    field.at('foo').deleteError();

    expect(field.invalid).toBe(false);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(false);
    expect(field.at('foo').error).toBe(null);
  });

  test('deletes an issue from the child field but parent remains invalid', () => {
    const field = createField({ foo: 0, bar: 'qux' }, doubterPlugin(fooBarShape));

    const issue1 = { code: 'aaa' };
    const issue2 = { code: 'bbb' };

    field.at('foo').setError(issue1);
    field.at('bar').setError(issue2);

    field.at('bar').deleteError();

    expect(field.invalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(true);
    expect(field.at('foo').error).toBe(issue1);

    expect(field.at('bar').invalid).toBe(false);
    expect(field.at('bar').error).toBe(null);
  });

  test('clears all issues', () => {
    const field = createField({ foo: 0, bar: 'qux' }, doubterPlugin(fooBarShape));

    const issue1 = { code: 'aaa' };
    const issue2 = { code: 'bbb' };

    field.at('foo').setError(issue1);
    field.at('bar').setError(issue2);

    field.clearErrors();

    expect(field.invalid).toBe(false);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(false);
    expect(field.at('foo').error).toBe(null);

    expect(field.at('bar').invalid).toBe(false);
    expect(field.at('bar').error).toBe(null);
  });

  test('validates the root field', () => {
    const field = createField({ foo: 0 }, doubterPlugin(fooShape));

    field.validate();

    expect(field.invalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(true);
    expect(field.at('foo').error).toEqual({
      code: 'numberGreaterThanOrEqual',
      path: ['foo'],
      input: 0,
      param: 3,
      message: 'Must be greater than or equal to 3',
      meta: undefined,
    });
  });

  test('validates the child field', () => {
    const field = createField({ foo: 0 }, doubterPlugin(fooShape));

    field.at('foo').validate();

    expect(field.invalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(true);
    expect(field.at('foo').error).toEqual({
      code: 'numberGreaterThanOrEqual',
      path: ['foo'],
      input: 0,
      param: 3,
      message: 'Must be greater than or equal to 3',
      meta: undefined,
    });
  });

  test('validates multiple fields', () => {
    const field = createField({ foo: 0, bar: 'qux' }, doubterPlugin(fooBarShape));

    field.validate();

    expect(field.invalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(true);
    expect(field.at('foo').error).toEqual({
      code: 'numberGreaterThanOrEqual',
      path: ['foo'],
      input: 0,
      param: 3,
      message: 'Must be greater than or equal to 3',
      meta: undefined,
    });

    expect(field.at('bar').invalid).toBe(true);
    expect(field.at('bar').error).toEqual({
      code: 'stringMaxLength',
      path: ['bar'],
      input: 'qux',
      param: 2,
      message: 'Must have the maximum length of 2',
      meta: undefined,
    });
  });

  test('validate clears previous validation issues', () => {
    const field = createField({ foo: 0, bar: 'qux' }, doubterPlugin(fooBarShape));

    field.validate();

    field.at('bar').setValue('');

    field.validate();

    expect(field.invalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(true);
    expect(field.at('foo').error).toEqual({
      code: 'numberGreaterThanOrEqual',
      path: ['foo'],
      input: 0,
      param: 3,
      message: 'Must be greater than or equal to 3',
      meta: undefined,
    });

    expect(field.at('bar').invalid).toBe(false);
    expect(field.at('bar').error).toBe(null);
  });

  test('validate does not clear an issue set from userland', () => {
    const field = createField({ foo: 0, bar: '' }, doubterPlugin(fooBarShape));

    const issue = { code: 'aaa' };

    field.at('bar').setError(issue);

    field.validate();

    expect(field.invalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(true);
    expect(field.at('foo').error).toEqual({
      code: 'numberGreaterThanOrEqual',
      path: ['foo'],
      input: 0,
      param: 3,
      message: 'Must be greater than or equal to 3',
      meta: undefined,
    });

    expect(field.at('bar').invalid).toBe(true);
    expect(field.at('bar').error).toBe(issue);
  });

  test('validate does not raise issues for transient fields', () => {
    const field = createField({ foo: 0, bar: 'qux' }, doubterPlugin(fooBarShape));

    field.at('bar').setTransientValue('aaabbb');

    field.validate();

    expect(field.invalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(true);
    expect(field.at('foo').error).toEqual({
      code: 'numberGreaterThanOrEqual',
      path: ['foo'],
      input: 0,
      param: 3,
      message: 'Must be greater than or equal to 3',
      meta: undefined,
    });

    expect(field.at('bar').invalid).toBe(false);
    expect(field.at('bar').error).toBe(null);
  });
});
