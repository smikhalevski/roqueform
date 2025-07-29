import { expect, test } from 'vitest';
import * as d from 'doubter';
import schemaPlugin from '../../main/plugin/schema.js';
import { createField } from '../../main/index.js';
import errorsPlugin from '../../main/plugin/errors.js';

const aaaShape = d.object({
  aaa: d.number().gte(3),
});

const aaaBbbShape = d.object({
  aaa: d.number().gte(3),
  bbb: d.string().max(2),
});

test('enhances the field', () => {
  const field = createField({ aaa: 0 }, [errorsPlugin<d.Issue>(), schemaPlugin(aaaShape)]);

  expect(field.isInvalid).toBe(false);
  expect(field.errors.length).toBe(0);

  expect(field.at('aaa').isInvalid).toBe(false);
  expect(field.at('aaa').errors.length).toBe(0);
});

test('sets an issue to the root field', () => {
  const field = createField({ aaa: 0 }, [errorsPlugin<d.Issue>(), schemaPlugin(aaaShape)]);

  const issue = { code: 'xxx' };

  field.addError(issue);

  expect(field.isInvalid).toBe(true);
  expect(field.errors).toEqual([issue]);

  expect(field.at('aaa').isInvalid).toBe(false);
  expect(field.at('aaa').errors.length).toBe(0);
});

test('sets an issue to the child field', () => {
  const field = createField({ aaa: 0 }, [errorsPlugin<d.Issue>(), schemaPlugin(aaaShape)]);

  const issue = { code: 'aaa' };

  field.at('aaa').addError(issue);

  expect(field.isInvalid).toBe(false);
  expect(field.errors.length).toBe(0);

  expect(field.at('aaa').isInvalid).toBe(true);
  expect(field.at('aaa').errors).toEqual([issue]);
});

test('validates the root field', () => {
  const field = createField({ aaa: 0 }, [errorsPlugin<d.Issue>(), schemaPlugin(aaaShape)]);

  field.validate();

  expect(field.isInvalid).toBe(false);
  expect(field.errors.length).toBe(0);

  expect(field.at('aaa').isInvalid).toBe(true);
  expect(field.at('aaa').errors).toEqual([
    {
      code: 'number.gte',
      path: ['aaa'],
      input: 0,
      param: 3,
      message: 'Must be greater than or equal to 3',
      meta: undefined,
    },
  ] satisfies d.Issue[]);
});

test('validates the child field', () => {
  const field = createField({ aaa: 0 }, [errorsPlugin<d.Issue>(), schemaPlugin(aaaShape)]);

  field.at('aaa').validate();

  expect(field.isInvalid).toBe(false);
  expect(field.errors.length).toBe(0);

  expect(field.at('aaa').isInvalid).toBe(true);
  expect(field.at('aaa').errors).toEqual([
    {
      code: 'number.gte',
      path: ['aaa'],
      input: 0,
      param: 3,
      message: 'Must be greater than or equal to 3',
      meta: undefined,
    },
  ] satisfies d.Issue[]);
});

test('validates multiple fields', () => {
  const field = createField({ aaa: 0, bbb: 'ccc' }, [errorsPlugin<d.Issue>(), schemaPlugin(aaaBbbShape)]);

  field.validate();

  expect(field.isInvalid).toBe(false);
  expect(field.errors.length).toBe(0);

  expect(field.at('aaa').isInvalid).toBe(true);
  expect(field.at('aaa').errors).toEqual([
    {
      code: 'number.gte',
      path: ['aaa'],
      input: 0,
      param: 3,
      message: 'Must be greater than or equal to 3',
      meta: undefined,
    },
  ] satisfies d.Issue[]);

  expect(field.at('bbb').isInvalid).toBe(true);
  expect(field.at('bbb').errors).toEqual([
    {
      code: 'string.max',
      path: ['bbb'],
      input: 'ccc',
      param: 2,
      message: 'Must have the maximum length of 2',
      meta: undefined,
    },
  ] satisfies d.Issue[]);
});

test('validate does not raise issues for transient fields', () => {
  const field = createField({ aaa: 0, bbb: 'ccc' }, [errorsPlugin<d.Issue>(), schemaPlugin(aaaBbbShape)]);

  field.at('bbb').setTransientValue('aaabbb');

  field.validate();

  expect(field.isInvalid).toBe(false);
  expect(field.errors.length).toBe(0);

  expect(field.at('aaa').isInvalid).toBe(true);
  expect(field.at('aaa').errors).toEqual([
    {
      code: 'number.gte',
      path: ['aaa'],
      input: 0,
      param: 3,
      message: 'Must be greater than or equal to 3',
      meta: undefined,
    },
  ] satisfies d.Issue[]);

  expect(field.at('bbb').isInvalid).toBe(false);
  expect(field.at('bbb').errors.length).toBe(0);
});
