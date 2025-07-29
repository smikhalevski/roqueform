import { beforeEach, describe, expect, test, vi } from 'vitest';
import * as d from 'doubter';
import schemaPlugin from '../../main/plugin/schema.js';
import { createField, FieldEvent } from '../../main/index.js';
import errorsPlugin from '../../main/plugin/errors.js';
import { StandardSchemaV1 } from '../../main/vendor/standard-schema.js';

const validateMock = vi.fn((value): StandardSchemaV1.Result<any> | Promise<StandardSchemaV1.Result<any>> => ({
  value,
}));

const schemaMock: StandardSchemaV1 = {
  '~standard': {
    vendor: 'test',
    version: 1,
    validate: validateMock,
  },
};

beforeEach(() => {
  validateMock.mockReset();
});

test('uses schema for validation', () => {
  const field = createField({ aaa: 111 }, [schemaPlugin(schemaMock)]);

  const listenerMock = vi.fn();

  field.subscribe(listenerMock);

  field.validate({ xxx: 222 });

  expect(validateMock).toHaveBeenCalledTimes(1);
  expect(validateMock).toHaveBeenNthCalledWith(1, { aaa: 111 }, { xxx: 222 });

  expect(listenerMock).toHaveBeenCalledTimes(2);
  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'validationStarted',
    target: field,
    relatedTarget: field,
    payload: { field: field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'validationFinished',
    target: field,
    relatedTarget: field,
    payload: { field: field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
});

test('composes transient value for validation', () => {
  const field = createField({ aaa: 111 }, [schemaPlugin(schemaMock)]);

  field.at('aaa').setTransientValue(222);
  field.at('aaa').validate({ xxx: 333 });

  expect(validateMock).toHaveBeenCalledTimes(1);
  expect(validateMock).toHaveBeenNthCalledWith(1, { aaa: 222 }, { xxx: 333 });
});

test('synchronously publishes issues for the root and child fields', () => {
  const field = createField({ aaa: 111 }, [schemaPlugin(schemaMock)]);

  const listenerMock = vi.fn();

  field.subscribe(listenerMock);

  validateMock.mockImplementationOnce(() => ({ issues: [{ message: 'ppp' }, { path: ['aaa'], message: 'qqq' }] }));

  field.validate({ xxx: 333 });

  expect(validateMock).toHaveBeenCalledTimes(1);
  expect(validateMock).toHaveBeenNthCalledWith(1, { aaa: 111 }, { xxx: 333 });

  expect(listenerMock).toHaveBeenCalledTimes(5);
  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'validationStarted',
    target: field,
    relatedTarget: field,
    payload: { field: field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'errorDetected',
    target: field,
    relatedTarget: field,
    payload: { message: 'ppp' },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(3, {
    type: 'errorDetected',
    target: field.at('aaa'),
    relatedTarget: field,
    payload: { path: ['aaa'], message: 'qqq' },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(4, {
    type: 'validationFinished',
    target: field,
    relatedTarget: field,
    payload: { field: field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
});

test('asynchronously publishes issues for the root and child fields', async () => {
  const field = createField({ aaa: 111 }, [schemaPlugin(schemaMock)]);

  const listenerMock = vi.fn();

  field.subscribe(listenerMock);

  validateMock.mockImplementationOnce(() =>
    Promise.resolve({ issues: [{ message: 'ppp' }, { path: ['aaa'], message: 'qqq' }] })
  );

  field.validate({ xxx: 333 });

  expect(validateMock).toHaveBeenCalledTimes(1);
  expect(validateMock).toHaveBeenNthCalledWith(1, { aaa: 111 }, { xxx: 333 });

  expect(listenerMock).toHaveBeenCalledTimes(1);
  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'validationStarted',
    target: field,
    relatedTarget: field,
    payload: { field: field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);

  await 0;

  expect(listenerMock).toHaveBeenCalledTimes(5);
  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'errorDetected',
    target: field,
    relatedTarget: field,
    payload: { message: 'ppp' },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(3, {
    type: 'errorDetected',
    target: field.at('aaa'),
    relatedTarget: field,
    payload: { path: ['aaa'], message: 'qqq' },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(4, {
    type: 'validationFinished',
    target: field,
    relatedTarget: field,
    payload: { field: field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
});

test('does not publish issues for the parent field', () => {
  const field = createField({ aaa: 111 }, [schemaPlugin(schemaMock)]);

  const listenerMock = vi.fn();

  field.subscribe(listenerMock);

  validateMock.mockImplementationOnce(() => ({ issues: [{ message: 'ppp' }, { path: ['aaa'], message: 'qqq' }] }));

  field.at('aaa').validate({ xxx: 333 });

  expect(validateMock).toHaveBeenCalledTimes(1);
  expect(validateMock).toHaveBeenNthCalledWith(1, { aaa: 111 }, { xxx: 333 });

  expect(listenerMock).toHaveBeenCalledTimes(3);
  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'validationStarted',
    target: field.at('aaa'),
    relatedTarget: field.at('aaa'),
    payload: { field: field.at('aaa'), abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'errorDetected',
    target: field.at('aaa'),
    relatedTarget: field.at('aaa'),
    payload: { path: ['aaa'], message: 'qqq' },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(3, {
    type: 'validationFinished',
    target: field.at('aaa'),
    relatedTarget: field.at('aaa'),
    payload: { field: field.at('aaa'), abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
});

test('does not publish issues for the sibling field', () => {
  const field = createField({ aaa: 111, bbb: 222 }, [schemaPlugin(schemaMock)]);

  const listenerMock = vi.fn();

  field.subscribe(listenerMock);

  validateMock.mockImplementationOnce(() => ({
    issues: [
      { path: ['bbb'], message: 'ppp' },
      { path: ['aaa'], message: 'qqq' },
    ],
  }));

  field.at('aaa').validate({ xxx: 333 });

  expect(validateMock).toHaveBeenCalledTimes(1);
  expect(validateMock).toHaveBeenNthCalledWith(1, { aaa: 111, bbb: 222 }, { xxx: 333 });

  expect(listenerMock).toHaveBeenCalledTimes(3);
  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'validationStarted',
    target: field.at('aaa'),
    relatedTarget: field.at('aaa'),
    payload: { field: field.at('aaa'), abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'errorDetected',
    target: field.at('aaa'),
    relatedTarget: field.at('aaa'),
    payload: { path: ['aaa'], message: 'qqq' },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(3, {
    type: 'validationFinished',
    target: field.at('aaa'),
    relatedTarget: field.at('aaa'),
    payload: { field: field.at('aaa'), abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
});

test('does not publish issues for the transient child field', () => {
  const field = createField({ aaa: 111, bbb: 222 }, [schemaPlugin(schemaMock)]);

  field.at('bbb').setTransientValue(333);

  const listenerMock = vi.fn();

  field.subscribe(listenerMock);

  validateMock.mockImplementationOnce(() => ({
    issues: [
      { path: ['bbb'], message: 'ppp' },
      { path: ['aaa'], message: 'qqq' },
    ],
  }));

  field.validate(undefined);

  expect(validateMock).toHaveBeenCalledTimes(1);
  expect(validateMock).toHaveBeenNthCalledWith(1, { aaa: 111, bbb: 222 }, undefined);

  expect(listenerMock).toHaveBeenCalledTimes(4);
  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'validationStarted',
    target: field,
    relatedTarget: field,
    payload: { field: field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'errorDetected',
    target: field.at('aaa'),
    relatedTarget: field,
    payload: { path: ['aaa'], message: 'qqq' },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(3, {
    type: 'validationFinished',
    target: field,
    relatedTarget: field,
    payload: { field: field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(4, {
    type: 'validationFinished',
    target: field.at('aaa'),
    relatedTarget: field,
    payload: { field: field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
});

describe('Doubter integration', () => {
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
});
