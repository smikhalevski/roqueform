import * as d from 'doubter';
import { doubterPlugin } from '../main';
import { createField, objectAccessor } from 'roqueform';

describe('doubterPlugin', () => {
  const fooType = d.object({
    foo: d.number().gte(3),
  });

  const fooBarType = d.object({
    foo: d.number().gte(3),
    bar: d.string().max(2),
  });

  test('enhances the field', () => {
    const field = createField(objectAccessor, { foo: 0 }, doubterPlugin(fooType));

    expect(field.isInvalid()).toBe(false);
    expect(field.getIssue()).toBe(null);

    expect(field.at('foo').isInvalid()).toBe(false);
    expect(field.at('foo').getIssue()).toBe(null);
  });

  test('sets an issue to the root field', () => {
    const field = createField(objectAccessor, { foo: 0 }, doubterPlugin(fooType));

    const issue = { code: 'aaa' };

    field.setIssue(issue);

    expect(field.isInvalid()).toBe(true);
    expect(field.getIssue()).toBe(issue);

    expect(field.at('foo').isInvalid()).toBe(false);
    expect(field.at('foo').getIssue()).toBe(null);
  });

  test('sets an issue to the child field', () => {
    const field = createField(objectAccessor, { foo: 0 }, doubterPlugin(fooType));

    const issue = { code: 'aaa' };

    field.at('foo').setIssue(issue);

    expect(field.isInvalid()).toBe(true);
    expect(field.getIssue()).toBe(null);

    expect(field.at('foo').isInvalid()).toBe(true);
    expect(field.at('foo').getIssue()).toBe(issue);
  });

  test('deletes an issue from the root field', () => {
    const field = createField(objectAccessor, { foo: 0 }, doubterPlugin(fooType));

    field.setIssue({ code: 'aaa' });
    field.deleteIssue();

    expect(field.isInvalid()).toBe(false);
    expect(field.getIssue()).toBe(null);

    expect(field.at('foo').isInvalid()).toBe(false);
    expect(field.at('foo').getIssue()).toBe(null);
  });

  test('deletes an issue from the child field', () => {
    const field = createField(objectAccessor, { foo: 0 }, doubterPlugin(fooType));

    field.at('foo').setIssue({ code: 'aaa' });
    field.at('foo').deleteIssue();

    expect(field.isInvalid()).toBe(false);
    expect(field.getIssue()).toBe(null);

    expect(field.at('foo').isInvalid()).toBe(false);
    expect(field.at('foo').getIssue()).toBe(null);
  });

  test('deletes an issue from the child field but parent remains invalid', () => {
    const field = createField(objectAccessor, { foo: 0, bar: 'qux' }, doubterPlugin(fooBarType));

    const issue1 = { code: 'aaa' };
    const issue2 = { code: 'bbb' };

    field.at('foo').setIssue(issue1);
    field.at('bar').setIssue(issue2);

    field.at('bar').deleteIssue();

    expect(field.isInvalid()).toBe(true);
    expect(field.getIssue()).toBe(null);

    expect(field.at('foo').isInvalid()).toBe(true);
    expect(field.at('foo').getIssue()).toBe(issue1);

    expect(field.at('bar').isInvalid()).toBe(false);
    expect(field.at('bar').getIssue()).toBe(null);
  });

  test('clears all issues', () => {
    const field = createField(objectAccessor, { foo: 0, bar: 'qux' }, doubterPlugin(fooBarType));

    const issue1 = { code: 'aaa' };
    const issue2 = { code: 'bbb' };

    field.at('foo').setIssue(issue1);
    field.at('bar').setIssue(issue2);

    field.clearIssues();

    expect(field.isInvalid()).toBe(false);
    expect(field.getIssue()).toBe(null);

    expect(field.at('foo').isInvalid()).toBe(false);
    expect(field.at('foo').getIssue()).toBe(null);

    expect(field.at('bar').isInvalid()).toBe(false);
    expect(field.at('bar').getIssue()).toBe(null);
  });

  test('validates the root field', () => {
    const field = createField(objectAccessor, { foo: 0 }, doubterPlugin(fooType));

    field.validate();

    expect(field.isInvalid()).toBe(true);
    expect(field.getIssue()).toBe(null);

    expect(field.at('foo').isInvalid()).toBe(true);
    expect(field.at('foo').getIssue()).toEqual({
      code: 'numberGreaterThanOrEqual',
      path: ['foo'],
      input: 0,
      param: 3,
      message: 'Must be greater than or equal to 3',
      meta: undefined,
    });
  });

  test('validates the child field', () => {
    const field = createField(objectAccessor, { foo: 0 }, doubterPlugin(fooType));

    field.at('foo').validate();

    expect(field.isInvalid()).toBe(true);
    expect(field.getIssue()).toBe(null);

    expect(field.at('foo').isInvalid()).toBe(true);
    expect(field.at('foo').getIssue()).toEqual({
      code: 'numberGreaterThanOrEqual',
      path: ['foo'],
      input: 0,
      param: 3,
      message: 'Must be greater than or equal to 3',
      meta: undefined,
    });
  });

  test('validates multiple fields', () => {
    const field = createField(objectAccessor, { foo: 0, bar: 'qux' }, doubterPlugin(fooBarType));

    field.validate();

    expect(field.isInvalid()).toBe(true);
    expect(field.getIssue()).toBe(null);

    expect(field.at('foo').isInvalid()).toBe(true);
    expect(field.at('foo').getIssue()).toEqual({
      code: 'numberGreaterThanOrEqual',
      path: ['foo'],
      input: 0,
      param: 3,
      message: 'Must be greater than or equal to 3',
      meta: undefined,
    });

    expect(field.at('bar').isInvalid()).toBe(true);
    expect(field.at('bar').getIssue()).toEqual({
      code: 'stringMaxLength',
      path: ['bar'],
      input: 'qux',
      param: 2,
      message: 'Must have the maximum length of 2',
      meta: undefined,
    });
  });

  test('validate clears previous validation issues', () => {
    const field = createField(objectAccessor, { foo: 0, bar: 'qux' }, doubterPlugin(fooBarType));

    field.validate();

    field.at('bar').dispatchValue('');

    field.validate();

    expect(field.isInvalid()).toBe(true);
    expect(field.getIssue()).toBe(null);

    expect(field.at('foo').isInvalid()).toBe(true);
    expect(field.at('foo').getIssue()).toEqual({
      code: 'numberGreaterThanOrEqual',
      path: ['foo'],
      input: 0,
      param: 3,
      message: 'Must be greater than or equal to 3',
      meta: undefined,
    });

    expect(field.at('bar').isInvalid()).toBe(false);
    expect(field.at('bar').getIssue()).toBe(null);
  });

  test('validate does not clear an issue set from userland', () => {
    const field = createField(objectAccessor, { foo: 0, bar: '' }, doubterPlugin(fooBarType));

    const issue = { code: 'aaa' };

    field.at('bar').setIssue(issue);

    field.validate();

    expect(field.isInvalid()).toBe(true);
    expect(field.getIssue()).toBe(null);

    expect(field.at('foo').isInvalid()).toBe(true);
    expect(field.at('foo').getIssue()).toEqual({
      code: 'numberGreaterThanOrEqual',
      path: ['foo'],
      input: 0,
      param: 3,
      message: 'Must be greater than or equal to 3',
      meta: undefined,
    });

    expect(field.at('bar').isInvalid()).toBe(true);
    expect(field.at('bar').getIssue()).toBe(issue);
  });

  test('validate does not raise issues for transient fields', () => {
    const field = createField(objectAccessor, { foo: 0, bar: 'qux' }, doubterPlugin(fooBarType));

    field.at('bar').setValue('aaabbb');

    field.validate();

    expect(field.isInvalid()).toBe(true);
    expect(field.getIssue()).toBe(null);

    expect(field.at('foo').isInvalid()).toBe(true);
    expect(field.at('foo').getIssue()).toEqual({
      code: 'numberGreaterThanOrEqual',
      path: ['foo'],
      input: 0,
      param: 3,
      message: 'Must be greater than or equal to 3',
      meta: undefined,
    });

    expect(field.at('bar').isInvalid()).toBe(false);
    expect(field.at('bar').getIssue()).toBe(null);
  });
});
