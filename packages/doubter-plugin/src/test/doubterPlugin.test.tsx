import * as d from 'doubter';
import { doubterPlugin } from '../main';
import { createField } from 'roqueform';

describe('doubterPlugin', () => {
  const aaaShape = d.object({
    aaa: d.number().gte(3),
  });

  const aaaBbbShape = d.object({
    aaa: d.number().gte(3),
    bbb: d.string().max(2),
  });

  test('enhances the field', () => {
    const field = createField({ aaa: 0 }, doubterPlugin(aaaShape));

    expect(field.isInvalid).toBe(false);
    expect(field.error).toBeNull();

    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').error).toBeNull();
  });

  test('sets an issue to the root field', () => {
    const field = createField({ aaa: 0 }, doubterPlugin(aaaShape));

    const issue = { code: 'xxx' };

    field.setError(issue);

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBe(issue);
    expect(field.error).toEqual({ code: 'xxx' });

    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').error).toBeNull();
  });

  test('sets an issue to the child field', () => {
    const field = createField({ aaa: 0 }, doubterPlugin(aaaShape));

    const issue = { code: 'aaa' };

    field.at('aaa').setError(issue);

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBeNull();

    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').error).toBe(issue);
    expect(field.at('aaa').error).toEqual({ code: 'aaa', path: ['aaa'] });
  });

  test('converts string errors to issue messages', () => {
    const field = createField({ aaa: 0 }, doubterPlugin(aaaShape));

    field.at('aaa').setError('xxx');

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBeNull();

    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').error).toEqual({ message: 'xxx', input: 0, path: ['aaa'] });
  });

  test('deletes an issue from the root field', () => {
    const field = createField({ aaa: 0 }, doubterPlugin(aaaShape));

    field.setError({ code: 'aaa' });
    field.deleteError();

    expect(field.isInvalid).toBe(false);
    expect(field.error).toBeNull();

    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').error).toBeNull();
  });

  test('deletes an issue from the child field', () => {
    const field = createField({ aaa: 0 }, doubterPlugin(aaaShape));

    field.at('aaa').setError({ code: 'aaa' });
    field.at('aaa').deleteError();

    expect(field.isInvalid).toBe(false);
    expect(field.error).toBeNull();

    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').error).toBeNull();
  });

  test('deletes an issue from the child field but parent remains invalid', () => {
    const field = createField({ aaa: 0, bbb: 'ccc' }, doubterPlugin(aaaBbbShape));

    const issue1 = { code: 'aaa' };
    const issue2 = { code: 'bbb' };

    field.at('aaa').setError(issue1);
    field.at('bbb').setError(issue2);

    field.at('bbb').deleteError();

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBeNull();

    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').error).toBe(issue1);

    expect(field.at('bbb').isInvalid).toBe(false);
    expect(field.at('bbb').error).toBeNull();
  });

  test('clears all issues', () => {
    const field = createField({ aaa: 0, bbb: 'ccc' }, doubterPlugin(aaaBbbShape));

    const issue1 = { code: 'aaa' };
    const issue2 = { code: 'bbb' };

    field.at('aaa').setError(issue1);
    field.at('bbb').setError(issue2);

    field.clearErrors();

    expect(field.isInvalid).toBe(false);
    expect(field.error).toBeNull();

    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').error).toBeNull();

    expect(field.at('bbb').isInvalid).toBe(false);
    expect(field.at('bbb').error).toBeNull();
  });

  test('validates the root field', () => {
    const field = createField({ aaa: 0 }, doubterPlugin(aaaShape));

    field.validate();

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBeNull();

    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').error).toEqual({
      code: 'number.gte',
      path: ['aaa'],
      input: 0,
      param: 3,
      message: 'Must be greater than or equal to 3',
      meta: undefined,
    });
  });

  test('validates the child field', () => {
    const field = createField({ aaa: 0 }, doubterPlugin(aaaShape));

    field.at('aaa').validate();

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBeNull();

    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').error).toEqual({
      code: 'number.gte',
      path: ['aaa'],
      input: 0,
      param: 3,
      message: 'Must be greater than or equal to 3',
      meta: undefined,
    });
  });

  test('validates multiple fields', () => {
    const field = createField({ aaa: 0, bbb: 'ccc' }, doubterPlugin(aaaBbbShape));

    field.validate();

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBeNull();

    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').error).toEqual({
      code: 'number.gte',
      path: ['aaa'],
      input: 0,
      param: 3,
      message: 'Must be greater than or equal to 3',
      meta: undefined,
    });

    expect(field.at('bbb').isInvalid).toBe(true);
    expect(field.at('bbb').error).toEqual({
      code: 'string.max',
      path: ['bbb'],
      input: 'ccc',
      param: 2,
      message: 'Must have the maximum length of 2',
      meta: undefined,
    });
  });

  test('validate clears previous validation issues', () => {
    const field = createField({ aaa: 0, bbb: 'ccc' }, doubterPlugin(aaaBbbShape));

    field.validate();

    field.at('bbb').setValue('');

    field.validate();

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBeNull();

    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').error).toEqual({
      code: 'number.gte',
      path: ['aaa'],
      input: 0,
      param: 3,
      message: 'Must be greater than or equal to 3',
      meta: undefined,
    });

    expect(field.at('bbb').isInvalid).toBe(false);
    expect(field.at('bbb').error).toBeNull();
  });

  test('validate does not clear an issue set from userland', () => {
    const field = createField({ aaa: 0, bbb: '' }, doubterPlugin(aaaBbbShape));

    const issue = { code: 'aaa' };

    field.at('bbb').setError(issue);

    field.validate();

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBeNull();

    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').error).toEqual({
      code: 'number.gte',
      path: ['aaa'],
      input: 0,
      param: 3,
      message: 'Must be greater than or equal to 3',
      meta: undefined,
    });

    expect(field.at('bbb').isInvalid).toBe(true);
    expect(field.at('bbb').error).toBe(issue);
  });

  test('validate does not raise issues for transient fields', () => {
    const field = createField({ aaa: 0, bbb: 'ccc' }, doubterPlugin(aaaBbbShape));

    field.at('bbb').setTransientValue('aaabbb');

    field.validate();

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBeNull();

    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').error).toEqual({
      code: 'number.gte',
      path: ['aaa'],
      input: 0,
      param: 3,
      message: 'Must be greater than or equal to 3',
      meta: undefined,
    });

    expect(field.at('bbb').isInvalid).toBe(false);
    expect(field.at('bbb').error).toBeNull();
  });
});
