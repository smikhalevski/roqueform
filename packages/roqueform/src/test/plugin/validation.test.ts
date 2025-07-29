import { expect, test, vi } from 'vitest';
import { createField, FieldEvent } from '../../main/index.js';
import validationPlugin, { Validation } from '../../main/plugin/validation.js';
import errorsPlugin from '../../main/plugin/errors.js';

test('child field inherits parent validation', () => {
  const field = createField({ aaa: 111 }, [validationPlugin(async () => undefined)]);

  field.validate();

  expect(field.validation).not.toBeNull();
  expect(field.at('aaa').validation).toBe(field.validation);
});

test('transient child fields are excluded from validation', () => {
  const field = createField({ aaa: 111 }, [validationPlugin(async () => undefined)]);

  field.at('aaa').setTransientValue(222);

  field.validate();

  expect(field.validation).not.toBeNull();
  expect(field.at('aaa').validation).toBeNull();
});

test('finishes validation if abortController is aborted', () => {
  const field = createField({ aaa: 111 }, [validationPlugin(async () => undefined)]);

  const listenerMock = vi.fn();
  const aaaListenerMock = vi.fn();

  field.subscribe(listenerMock);
  field.at('aaa').subscribe(aaaListenerMock);

  field.validate();

  expect(field.isValidating).toBe(true);

  expect(field.at('aaa').isValidating).toBe(true);

  expect(listenerMock).toHaveBeenCalledTimes(2);
  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'validationStarted',
    target: field,
    relatedTarget: field,
    payload: { field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'validationStarted',
    target: field.at('aaa'),
    relatedTarget: field,
    payload: { field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);

  expect(aaaListenerMock).toHaveBeenCalledTimes(1);
  expect(aaaListenerMock).toHaveBeenNthCalledWith(1, {
    type: 'validationStarted',
    target: field.at('aaa'),
    relatedTarget: field,
    payload: { field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);

  field.validation!.abortController.abort(new Error('expected'));

  expect(listenerMock).toHaveBeenCalledTimes(4);
  expect(listenerMock).toHaveBeenNthCalledWith(3, {
    type: 'validationFinished',
    target: field,
    relatedTarget: field,
    payload: { field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(4, {
    type: 'validationFinished',
    target: field.at('aaa'),
    relatedTarget: field,
    payload: { field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);

  expect(aaaListenerMock).toHaveBeenCalledTimes(2);
  expect(aaaListenerMock).toHaveBeenNthCalledWith(2, {
    type: 'validationFinished',
    target: field.at('aaa'),
    relatedTarget: field,
    payload: { field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
});

test('synchronously validates the root field', () => {
  const field = createField({ aaa: 111 }, [
    validationPlugin(validation => {
      validation.field
        .at('aaa')
        .publish({ type: 'XXX', target: validation.field, relatedTarget: null, payload: undefined });

      return 111;
    }),
  ]);

  const listenerMock = vi.fn();
  const aaaListenerMock = vi.fn();

  field.subscribe(listenerMock);
  field.at('aaa').subscribe(aaaListenerMock);

  expect(field.validate()).toBe(111);

  expect(field.isValidating).toBe(false);

  expect(field.at('aaa').isValidating).toBe(false);

  expect(listenerMock).toHaveBeenCalledTimes(5);
  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'validationStarted',
    target: field,
    relatedTarget: field,
    payload: { field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'validationStarted',
    target: field.at('aaa'),
    relatedTarget: field,
    payload: { field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(3, {
    type: 'XXX',
    target: field,
    relatedTarget: null,
    payload: undefined,
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(4, {
    type: 'validationFinished',
    target: field,
    relatedTarget: field,
    payload: { field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(5, {
    type: 'validationFinished',
    target: field.at('aaa'),
    relatedTarget: field,
    payload: { field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);

  expect(aaaListenerMock).toHaveBeenCalledTimes(3);
  expect(aaaListenerMock).toHaveBeenNthCalledWith(1, {
    type: 'validationStarted',
    target: field.at('aaa'),
    relatedTarget: field,
    payload: { field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
  expect(aaaListenerMock).toHaveBeenNthCalledWith(2, {
    type: 'XXX',
    target: field,
    relatedTarget: null,
    payload: undefined,
  } satisfies FieldEvent);
  expect(aaaListenerMock).toHaveBeenNthCalledWith(3, {
    type: 'validationFinished',
    target: field.at('aaa'),
    relatedTarget: field,
    payload: { field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
});

test('synchronously validates the child field', () => {
  const field = createField({ aaa: 111 }, [
    validationPlugin(validation => {
      validation.field.publish({ type: 'XXX', target: validation.field, relatedTarget: null, payload: undefined });

      return 111;
    }),
  ]);

  const listenerMock = vi.fn();
  const aaaListenerMock = vi.fn();

  field.subscribe(listenerMock);
  field.at('aaa').subscribe(aaaListenerMock);

  field.at('aaa').validate();

  expect(field.isValidating).toBe(false);

  expect(field.at('aaa').isValidating).toBe(false);

  expect(listenerMock).toHaveBeenCalledTimes(3);
  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'validationStarted',
    target: field.at('aaa'),
    relatedTarget: field.at('aaa'),
    payload: { field: field.at('aaa'), abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'XXX',
    target: field.at('aaa'),
    relatedTarget: null,
    payload: undefined,
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(3, {
    type: 'validationFinished',
    target: field.at('aaa'),
    relatedTarget: field.at('aaa'),
    payload: { field: field.at('aaa'), abortController: expect.any(AbortController) },
  } satisfies FieldEvent);

  expect(aaaListenerMock).toHaveBeenCalledTimes(3);
  expect(aaaListenerMock).toHaveBeenNthCalledWith(1, {
    type: 'validationStarted',
    target: field.at('aaa'),
    relatedTarget: field.at('aaa'),
    payload: { field: field.at('aaa'), abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
  expect(aaaListenerMock).toHaveBeenNthCalledWith(2, {
    type: 'XXX',
    target: field.at('aaa'),
    relatedTarget: null,
    payload: undefined,
  } satisfies FieldEvent);
  expect(aaaListenerMock).toHaveBeenNthCalledWith(3, {
    type: 'validationFinished',
    target: field.at('aaa'),
    relatedTarget: field.at('aaa'),
    payload: { field: field.at('aaa'), abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
});

test('asynchronously validates the root field', async () => {
  const field = createField({ aaa: 111 }, [
    validationPlugin(async validation => {
      await 0;

      validation.field
        .at('aaa')
        .publish({ type: 'XXX', target: validation.field, relatedTarget: null, payload: undefined });

      return 111;
    }),
  ]);

  const listenerMock = vi.fn();
  const aaaListenerMock = vi.fn();

  field.subscribe(listenerMock);
  field.at('aaa').subscribe(aaaListenerMock);

  const promise = field.validate();

  expect(promise).toBeInstanceOf(Promise);

  expect(field.isValidating).toBe(true);
  expect(field.at('aaa').isValidating).toBe(true);

  expect(listenerMock).toHaveBeenCalledTimes(2);
  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'validationStarted',
    target: field,
    relatedTarget: field,
    payload: { field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'validationStarted',
    target: field.at('aaa'),
    relatedTarget: field,
    payload: { field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);

  expect(aaaListenerMock).toHaveBeenCalledTimes(1);
  expect(aaaListenerMock).toHaveBeenNthCalledWith(1, {
    type: 'validationStarted',
    target: field.at('aaa'),
    relatedTarget: field,
    payload: { field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);

  await expect(promise).resolves.toBe(111);

  expect(field.isValidating).toBe(false);

  expect(field.at('aaa').isValidating).toBe(false);

  expect(listenerMock).toHaveBeenCalledTimes(5);
  expect(listenerMock).toHaveBeenNthCalledWith(3, {
    type: 'XXX',
    target: field,
    relatedTarget: null,
    payload: undefined,
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(4, {
    type: 'validationFinished',
    target: field,
    relatedTarget: field,
    payload: { field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(5, {
    type: 'validationFinished',
    target: field.at('aaa'),
    relatedTarget: field,
    payload: { field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);

  expect(aaaListenerMock).toHaveBeenCalledTimes(3);
  expect(aaaListenerMock).toHaveBeenNthCalledWith(2, {
    type: 'XXX',
    target: field,
    relatedTarget: null,
    payload: undefined,
  } satisfies FieldEvent);
  expect(aaaListenerMock).toHaveBeenNthCalledWith(3, {
    type: 'validationFinished',
    target: field.at('aaa'),
    relatedTarget: field,
    payload: { field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
});

test('asynchronously validates the child field', async () => {
  const field = createField({ aaa: 111 }, [
    validationPlugin(async validation => {
      await 0;

      validation.field.publish({ type: 'XXX', target: validation.field, relatedTarget: null, payload: undefined });

      return 111;
    }),
  ]);

  const listenerMock = vi.fn();
  const aaaListenerMock = vi.fn();

  field.subscribe(listenerMock);
  field.at('aaa').subscribe(aaaListenerMock);

  const promise = field.at('aaa').validate();

  expect(field.isValidating).toBe(false);
  expect(field.at('aaa').isValidating).toBe(true);

  expect(listenerMock).toHaveBeenCalledTimes(1);
  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'validationStarted',
    target: field.at('aaa'),
    relatedTarget: field.at('aaa'),
    payload: { field: field.at('aaa'), abortController: expect.any(AbortController) },
  } satisfies FieldEvent);

  expect(aaaListenerMock).toHaveBeenCalledTimes(1);
  expect(aaaListenerMock).toHaveBeenNthCalledWith(1, {
    type: 'validationStarted',
    target: field.at('aaa'),
    relatedTarget: field.at('aaa'),
    payload: { field: field.at('aaa'), abortController: expect.any(AbortController) },
  } satisfies FieldEvent);

  await expect(promise).resolves.toBe(111);

  expect(field.isValidating).toBe(false);

  expect(field.at('aaa').isValidating).toBe(false);

  expect(listenerMock).toHaveBeenCalledTimes(3);
  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'XXX',
    target: field.at('aaa'),
    relatedTarget: null,
    payload: undefined,
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(3, {
    type: 'validationFinished',
    target: field.at('aaa'),
    relatedTarget: field.at('aaa'),
    payload: { field: field.at('aaa'), abortController: expect.any(AbortController) },
  } satisfies FieldEvent);

  expect(aaaListenerMock).toHaveBeenCalledTimes(3);
  expect(aaaListenerMock).toHaveBeenNthCalledWith(2, {
    type: 'XXX',
    target: field.at('aaa'),
    relatedTarget: null,
    payload: undefined,
  } satisfies FieldEvent);
  expect(aaaListenerMock).toHaveBeenNthCalledWith(3, {
    type: 'validationFinished',
    target: field.at('aaa'),
    relatedTarget: field.at('aaa'),
    payload: { field: field.at('aaa'), abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
});

test('cleans up validation if a sync error is thrown', () => {
  const field = createField({ aaa: 111, bbb: 222 }, [
    validationPlugin(() => {
      throw new Error('expected');
    }),
  ]);

  field.at('aaa');

  expect(() => field.validate()).toThrow(new Error('expected'));

  expect(field.isValidating).toBe(false);

  expect(field.at('aaa').isValidating).toBe(false);
});

test('cleans up validation if an async error is thrown', async () => {
  const field = createField({ aaa: 111, bbb: 222 }, [
    validationPlugin(async () => {
      await 0;
      throw new Error('expected');
    }),
  ]);

  field.at('aaa');

  const promise = field.validate();

  await expect(promise).rejects.toEqual(new Error('expected'));

  expect(field.isValidating).toBe(false);

  expect(field.at('aaa').isValidating).toBe(false);
});

test('aborts validation', async () => {
  const validatorMock = vi.fn(async (_validation: Validation<any>) => 111);

  const field = createField({ aaa: 111, bbb: 222 }, [validationPlugin(validatorMock)]);

  const promise = field.validate();

  expect(field.isValidating).toBe(true);
  expect(field.at('aaa').isValidating).toBe(true);

  field.abortValidation();

  expect(validatorMock.mock.calls[0][0].abortController.signal.aborted).toBe(true);
  expect(field.isValidating).toBe(false);
  expect(field.at('aaa').isValidating).toBe(false);

  await expect(promise).resolves.toBe(111);
});

test('aborts pending validation when invoked on the same field', async () => {
  const validatorMock = vi.fn(async (_validation: Validation<any>) => 111);

  const field = createField({ aaa: 111, bbb: 222 }, [validationPlugin(validatorMock)]);

  const promise = field.validate();

  field.validate();

  expect(validatorMock.mock.calls[0][0].abortController.signal.aborted).toBe(true);
  expect(validatorMock.mock.calls[1][0].abortController.signal.aborted).toBe(false);

  await expect(promise).resolves.toBe(111);
});

test('child field validation aborts the parent validation', async () => {
  const validatorMock = vi.fn(async (_validation: Validation<any>) => 111);

  const field = createField({ aaa: 111, bbb: 222 }, [validationPlugin(validatorMock)]);

  const promise = field.validate();
  const aaaPromise = field.at('aaa').validate();

  await expect(promise).resolves.toBe(111);
  await expect(aaaPromise).resolves.toBe(111);

  expect(validatorMock.mock.calls[0][0].abortController.signal.aborted).toBe(true);
  expect(validatorMock.mock.calls[1][0].abortController.signal.aborted).toBe(false);
});

test('validation can be called in valueChanged listener', () => {
  const field = createField({ aaa: 111 }, [validationPlugin(() => undefined)]);

  const listenerMock = vi.fn((event: FieldEvent) => {
    if (event.type === 'valueChanged' && event.target === field) {
      field.validate();
    }
  });

  field.subscribe(listenerMock);

  field.at('aaa').setValue(222);

  expect(listenerMock).toHaveBeenCalledTimes(6);
  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'valueChanged',
    target: field,
    relatedTarget: field.at('aaa'),
    payload: { aaa: 111 },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'validationStarted',
    target: field,
    relatedTarget: field,
    payload: { field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(3, {
    type: 'validationStarted',
    target: field.at('aaa'),
    relatedTarget: field,
    payload: { field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(4, {
    type: 'validationFinished',
    target: field,
    relatedTarget: field,
    payload: { field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(5, {
    type: 'validationFinished',
    target: field.at('aaa'),
    relatedTarget: field,
    payload: { field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(6, {
    type: 'valueChanged',
    target: field.at('aaa'),
    relatedTarget: field.at('aaa'),
    payload: 111,
  } satisfies FieldEvent);
});

test('synchronously validates the root field and adds errors using errorsPlugin', () => {
  const field = createField({ aaa: 111 }, [
    errorsPlugin(),
    validationPlugin(validation => {
      validation.field.at('aaa').publish({
        type: 'errorDetected',
        target: field.at('aaa'),
        relatedTarget: null,
        payload: 222,
      });

      return 111;
    }),
  ]);

  const listenerMock = vi.fn();
  const aaaListenerMock = vi.fn();

  field.subscribe(listenerMock);
  field.at('aaa').subscribe(aaaListenerMock);

  expect(field.validate()).toBe(111);

  expect(field.isValidating).toBe(false);
  expect(field.isInvalid).toBe(false);
  expect(field.errors.length).toBe(0);

  expect(field.at('aaa').isValidating).toBe(false);
  expect(field.at('aaa').isInvalid).toBe(true);
  expect(field.at('aaa').errors).toEqual([222]);

  expect(listenerMock).toHaveBeenCalledTimes(6);
  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'validationStarted',
    target: field,
    relatedTarget: field,
    payload: { field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'validationStarted',
    target: field.at('aaa'),
    relatedTarget: field,
    payload: { field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(3, {
    type: 'errorAdded',
    target: field.at('aaa'),
    relatedTarget: null,
    payload: 222,
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(4, {
    type: 'errorDetected',
    target: field.at('aaa'),
    relatedTarget: null,
    payload: 222,
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(5, {
    type: 'validationFinished',
    target: field,
    relatedTarget: field,
    payload: { field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(6, {
    type: 'validationFinished',
    target: field.at('aaa'),
    relatedTarget: field,
    payload: { field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);

  expect(aaaListenerMock).toHaveBeenCalledTimes(4);
  expect(aaaListenerMock).toHaveBeenNthCalledWith(1, {
    type: 'validationStarted',
    target: field.at('aaa'),
    relatedTarget: field,
    payload: { field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
  expect(aaaListenerMock).toHaveBeenNthCalledWith(2, {
    type: 'errorAdded',
    target: field.at('aaa'),
    relatedTarget: null,
    payload: 222,
  } satisfies FieldEvent);
  expect(aaaListenerMock).toHaveBeenNthCalledWith(3, {
    type: 'errorDetected',
    target: field.at('aaa'),
    relatedTarget: null,
    payload: 222,
  } satisfies FieldEvent);
  expect(aaaListenerMock).toHaveBeenNthCalledWith(4, {
    type: 'validationFinished',
    target: field.at('aaa'),
    relatedTarget: field,
    payload: { field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
});

test('asynchronously validates the root field and adds errors using errorsPlugin', async () => {
  const field = createField({ aaa: 111 }, [
    errorsPlugin(),
    validationPlugin(async validation => {
      await 0;

      validation.field.at('aaa').publish({
        type: 'errorDetected',
        target: field.at('aaa'),
        relatedTarget: null,
        payload: 222,
      });

      return 111;
    }),
  ]);

  const listenerMock = vi.fn();
  const aaaListenerMock = vi.fn();

  field.subscribe(listenerMock);
  field.at('aaa').subscribe(aaaListenerMock);

  const promise = field.validate();

  expect(promise).toBeInstanceOf(Promise);

  expect(field.isValidating).toBe(true);
  expect(field.at('aaa').isValidating).toBe(true);

  await expect(promise).resolves.toBe(111);

  expect(field.isValidating).toBe(false);
  expect(field.isInvalid).toBe(false);
  expect(field.errors.length).toBe(0);

  expect(field.at('aaa').isValidating).toBe(false);
  expect(field.at('aaa').isInvalid).toBe(true);
  expect(field.at('aaa').errors).toEqual([222]);

  expect(listenerMock).toHaveBeenCalledTimes(6);
  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'validationStarted',
    target: field,
    relatedTarget: field,
    payload: { field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'validationStarted',
    target: field.at('aaa'),
    relatedTarget: field,
    payload: { field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(3, {
    type: 'errorAdded',
    target: field.at('aaa'),
    relatedTarget: null,
    payload: 222,
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(4, {
    type: 'errorDetected',
    target: field.at('aaa'),
    relatedTarget: null,
    payload: 222,
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(5, {
    type: 'validationFinished',
    target: field,
    relatedTarget: field,
    payload: { field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(6, {
    type: 'validationFinished',
    target: field.at('aaa'),
    relatedTarget: field,
    payload: { field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);

  expect(aaaListenerMock).toHaveBeenCalledTimes(4);
  expect(aaaListenerMock).toHaveBeenNthCalledWith(1, {
    type: 'validationStarted',
    target: field.at('aaa'),
    relatedTarget: field,
    payload: { field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
  expect(aaaListenerMock).toHaveBeenNthCalledWith(2, {
    type: 'errorAdded',
    target: field.at('aaa'),
    relatedTarget: null,
    payload: 222,
  } satisfies FieldEvent);
  expect(aaaListenerMock).toHaveBeenNthCalledWith(3, {
    type: 'errorDetected',
    target: field.at('aaa'),
    relatedTarget: null,
    payload: 222,
  } satisfies FieldEvent);
  expect(aaaListenerMock).toHaveBeenNthCalledWith(4, {
    type: 'validationFinished',
    target: field.at('aaa'),
    relatedTarget: field,
    payload: { field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
});
