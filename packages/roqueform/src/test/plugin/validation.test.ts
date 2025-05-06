import { createField, FieldEvent } from '../../main';
import validationPlugin from '../../main/plugin/validation';
import errorsPlugin from '../../main/plugin/errors';

test('synchronously validates the root field', () => {
  const field = createField({ aaa: 111 }, [
    validationPlugin({
      validate(field) {
        field.at('aaa').isInvalid = true;
      },
    }),
  ]);

  const listenerMock = jest.fn();
  const aaaListenerMock = jest.fn();

  field.subscribe(listenerMock);
  field.at('aaa').subscribe(aaaListenerMock);

  expect(field.validate()).toBe(false);

  expect(field.isValidating).toBe(false);
  expect(field.isInvalid).toBe(undefined);

  expect(field.at('aaa').isValidating).toBe(false);
  expect(field.at('aaa').isInvalid).toBe(true);

  expect(listenerMock).toHaveBeenCalledTimes(4);
  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'validationStarted',
    target: field,
    relatedTarget: field,
    currentTarget: field,
    payload: { rootField: field, abortController: null },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'validationStarted',
    target: field.at('aaa'),
    relatedTarget: field,
    currentTarget: field.at('aaa'),
    payload: { rootField: field, abortController: null },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(3, {
    type: 'validationFinished',
    target: field,
    relatedTarget: field,
    currentTarget: field,
    payload: { rootField: field, abortController: null },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(4, {
    type: 'validationFinished',
    target: field.at('aaa'),
    relatedTarget: field,
    currentTarget: field.at('aaa'),
    payload: { rootField: field, abortController: null },
  } satisfies FieldEvent);

  expect(aaaListenerMock).toHaveBeenCalledTimes(2);
  expect(aaaListenerMock).toHaveBeenNthCalledWith(1, {
    type: 'validationStarted',
    target: field.at('aaa'),
    relatedTarget: field,
    currentTarget: field.at('aaa'),
    payload: { rootField: field, abortController: null },
  } satisfies FieldEvent);
  expect(aaaListenerMock).toHaveBeenNthCalledWith(2, {
    type: 'validationFinished',
    target: field.at('aaa'),
    relatedTarget: field,
    currentTarget: field.at('aaa'),
    payload: { rootField: field, abortController: null },
  } satisfies FieldEvent);
});

test('synchronously validates the child field', () => {
  const field = createField({ aaa: 111 }, [
    validationPlugin({
      validate(field) {
        field.isInvalid = true;
      },
    }),
  ]);

  const listenerMock = jest.fn();
  const aaaListenerMock = jest.fn();

  field.subscribe(listenerMock);
  field.at('aaa').subscribe(aaaListenerMock);

  field.at('aaa').validate();

  expect(field.isValidating).toBe(false);
  expect(field.isInvalid).toBe(undefined);

  expect(field.at('aaa').isValidating).toBe(false);
  expect(field.at('aaa').isInvalid).toBe(true);

  expect(listenerMock).toHaveBeenCalledTimes(2);
  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'validationStarted',
    target: field.at('aaa'),
    relatedTarget: field.at('aaa'),
    currentTarget: field.at('aaa'),
    payload: { rootField: field.at('aaa'), abortController: null },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'validationFinished',
    target: field.at('aaa'),
    relatedTarget: field.at('aaa'),
    currentTarget: field.at('aaa'),
    payload: { rootField: field.at('aaa'), abortController: null },
  } satisfies FieldEvent);

  expect(aaaListenerMock).toHaveBeenCalledTimes(2);
  expect(aaaListenerMock).toHaveBeenNthCalledWith(1, {
    type: 'validationStarted',
    target: field.at('aaa'),
    relatedTarget: field.at('aaa'),
    currentTarget: field.at('aaa'),
    payload: { rootField: field.at('aaa'), abortController: null },
  } satisfies FieldEvent);
  expect(aaaListenerMock).toHaveBeenNthCalledWith(2, {
    type: 'validationFinished',
    target: field.at('aaa'),
    relatedTarget: field.at('aaa'),
    currentTarget: field.at('aaa'),
    payload: { rootField: field.at('aaa'), abortController: null },
  } satisfies FieldEvent);
});

test('asynchronously validates the root field', async () => {
  const field = createField({ aaa: 111 }, [
    validationPlugin({
      async validateAsync(field) {
        field.at('aaa').isInvalid = true;
      },
    }),
  ]);

  const listenerMock = jest.fn();
  const aaaListenerMock = jest.fn();

  field.subscribe(listenerMock);
  field.at('aaa').subscribe(aaaListenerMock);

  const promise = field.validateAsync();

  expect(promise).toBeInstanceOf(Promise);

  expect(field.isValidating).toBe(true);
  expect(field.at('aaa').isValidating).toBe(true);

  await expect(promise).resolves.toEqual(false);

  expect(field.isValidating).toBe(false);
  expect(field.isInvalid).toBe(undefined);

  expect(field.at('aaa').isValidating).toBe(false);
  expect(field.at('aaa').isInvalid).toBe(true);

  expect(listenerMock).toHaveBeenCalledTimes(4);
  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'validationStarted',
    target: field,
    relatedTarget: field,
    currentTarget: field,
    payload: { rootField: field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'validationStarted',
    target: field.at('aaa'),
    relatedTarget: field,
    currentTarget: field.at('aaa'),
    payload: { rootField: field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(3, {
    type: 'validationFinished',
    target: field,
    relatedTarget: field,
    currentTarget: field,
    payload: { rootField: field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(4, {
    type: 'validationFinished',
    target: field.at('aaa'),
    relatedTarget: field,
    currentTarget: field.at('aaa'),
    payload: { rootField: field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);

  expect(aaaListenerMock).toHaveBeenCalledTimes(2);
  expect(aaaListenerMock).toHaveBeenNthCalledWith(1, {
    type: 'validationStarted',
    target: field.at('aaa'),
    relatedTarget: field,
    currentTarget: field.at('aaa'),
    payload: { rootField: field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
  expect(aaaListenerMock).toHaveBeenNthCalledWith(2, {
    type: 'validationFinished',
    target: field.at('aaa'),
    relatedTarget: field,
    currentTarget: field.at('aaa'),
    payload: { rootField: field, abortController: expect.any(AbortController) },
  } satisfies FieldEvent);
});

test('asynchronously validates the child field', async () => {
  const field = createField({ aaa: 111 }, [
    validationPlugin({
      async validateAsync(field) {
        field.isInvalid = true;
      },
    }),
  ]);

  const listenerMock = jest.fn();
  const aaaListenerMock = jest.fn();

  field.subscribe(listenerMock);
  field.at('aaa').subscribe(aaaListenerMock);

  const promise = field.at('aaa').validateAsync();

  expect(field.isValidating).toBe(false);
  expect(field.at('aaa').isValidating).toBe(true);

  await expect(promise).resolves.toEqual(false);

  expect(field.isValidating).toBe(false);
  expect(field.isInvalid).toBe(undefined);

  expect(field.at('aaa').isValidating).toBe(false);
  expect(field.at('aaa').isInvalid).toBe(true);

  expect(listenerMock).toHaveBeenCalledTimes(2);
  expect(aaaListenerMock).toHaveBeenCalledTimes(2);
});

test('cleans up validation if a sync error is thrown', () => {
  const field = createField({ aaa: 111, bbb: 222 }, [
    validationPlugin({
      validate() {
        throw new Error('expected');
      },
    }),
  ]);

  field.at('aaa');

  expect(() => field.validate()).toThrow(new Error('expected'));

  expect(field.isValidating).toBe(false);
  expect(field.isInvalid).toBe(undefined);

  expect(field.at('aaa').isValidating).toBe(false);
  expect(field.at('aaa').isInvalid).toBe(undefined);
});

test('cleans up validation if an async error is thrown', async () => {
  const field = createField({ aaa: 111, bbb: 222 }, [
    validationPlugin({
      async validateAsync() {
        throw new Error('expected');
      },
    }),
  ]);

  field.at('aaa');

  const promise = field.validateAsync();

  await expect(promise).rejects.toEqual(new Error('expected'));

  expect(field.isValidating).toBe(false);
  expect(field.isInvalid).toBe(undefined);

  expect(field.at('aaa').isValidating).toBe(false);
  expect(field.at('aaa').isInvalid).toBe(undefined);
});

test('aborts validation', async () => {
  let lastSignal: AbortSignal | undefined;

  const field = createField({ aaa: 111, bbb: 222 }, [
    validationPlugin({
      async validateAsync(field) {
        lastSignal = field.validation!.abortController!.signal;
      },
    }),
  ]);

  const promise = field.validateAsync();

  expect(field.isValidating).toBe(true);
  expect(field.at('aaa').isValidating).toBe(true);

  field.abortValidation();

  expect(lastSignal!.aborted).toBe(true);
  expect(field.isValidating).toBe(false);
  expect(field.at('aaa').isValidating).toBe(false);

  await expect(promise).rejects.toEqual(new Error('Validation was aborted'));
});

test('aborts pending validation when invoked on the same field', async () => {
  const signals: AbortSignal[] = [];

  const field = createField({ aaa: 111, bbb: 222 }, [
    validationPlugin({
      async validateAsync(field) {
        signals.push(field.validation!.abortController!.signal);
      },
    }),
  ]);

  const promise = field.validateAsync();

  field.validateAsync();

  expect(signals[0].aborted).toBe(true);
  expect(signals[1].aborted).toBe(false);

  await expect(promise).rejects.toEqual(new Error('Validation was aborted'));
});

test('child field validation aborts the parent validation', async () => {
  const signals: AbortSignal[] = [];

  const field = createField({ aaa: 111, bbb: 222 }, [
    validationPlugin({
      async validateAsync(field) {
        signals.push(field.validation!.abortController!.signal);
      },
    }),
  ]);

  const promise = field.validateAsync();
  const aaaPromise = field.at('aaa').validateAsync();

  await expect(promise).rejects.toEqual(new Error('Validation was aborted'));
  await expect(aaaPromise).resolves.toBe(true);

  expect(signals[0].aborted).toBe(true);
  expect(signals[1].aborted).toBe(false);
});
//
// test('validation can be called in valueChanged listener', () => {
//   const field = createField({ aaa: 111 }, [
//     validationPlugin({
//       validate() {},
//     }),
//   ]);
//
//   const listenerMock = jest.fn((event: FieldEvent) => {
//     if (event.type === 'valueChanged') {
//       field.validate();
//     }
//   });
//
//   field.subscribe(listenerMock);
//
//   field.at('aaa').setValue(222);
//
//   expect(listenerMock).toHaveBeenCalledTimes(2);
// });
//
// test('synchronously validates the root field and adds errors using errorsPlugin', () => {
//   const field = createField({ aaa: 111 }, [
//     errorsPlugin(),
//     validationPlugin({
//       validate(field) {
//         field.at('aaa').publish(new FieldEvent('errorCaught', field.at('aaa'), null, 222));
//       },
//     }),
//   ]);
//
//   const listenerMock = jest.fn();
//   const aaaListenerMock = jest.fn();
//
//   field.subscribe(listenerMock);
//   field.at('aaa').subscribe(aaaListenerMock);
//
//   expect(field.validate()).toBe(false);
//
//   expect(field.isValidating).toBe(false);
//   expect(field.isInvalid).toBe(false);
//   expect(field.errors.length).toBe(0);
//
//   expect(field.at('aaa').isValidating).toBe(false);
//   expect(field.at('aaa').isInvalid).toBe(true);
//   expect(field.at('aaa').errors).toEqual([222]);
//
//   expect(listenerMock).toHaveBeenCalledTimes(6);
//   expect(listenerMock).toHaveBeenNthCalledWith(1, {
//     type: 'validationStarted',
//     target: field,
//     relatedTarget: field,
//     currentTarget: field,
//     payload: { rootField: field, abortController: null },
//   } satisfies FieldEvent);
//   expect(listenerMock).toHaveBeenNthCalledWith(2, {
//     type: 'validationStarted',
//     target: field.at('aaa'),
//     relatedTarget: field,
//     currentTarget: field.at('aaa'),
//     payload: { rootField: field, abortController: null },
//   } satisfies FieldEvent);
//   expect(listenerMock).toHaveBeenNthCalledWith(3, {
//     type: 'errorAdded',
//     target: field.at('aaa'),
//     relatedTarget: null,
//     currentTarget: field.at('aaa'),
//     payload: 222,
//   } satisfies FieldEvent);
//   expect(listenerMock).toHaveBeenNthCalledWith(4, {
//     type: 'validationFinished',
//     target: field,
//     relatedTarget: field,
//     currentTarget: field,
//     payload: { rootField: field, abortController: null },
//   } satisfies FieldEvent);
//   expect(listenerMock).toHaveBeenNthCalledWith(5, {
//     type: 'validationFinished',
//     target: field.at('aaa'),
//     relatedTarget: field,
//     currentTarget: field.at('aaa'),
//     payload: { rootField: field, abortController: null },
//   } satisfies FieldEvent);
//
//   expect(aaaListenerMock).toHaveBeenCalledTimes(3);
//   expect(aaaListenerMock).toHaveBeenNthCalledWith(1, {
//     type: 'validationStarted',
//     target: field.at('aaa'),
//     relatedTarget: field,
//     currentTarget: field.at('aaa'),
//     payload: { rootField: field, abortController: null },
//   } satisfies FieldEvent);
//   expect(aaaListenerMock).toHaveBeenNthCalledWith(2, {
//     type: 'change:errors',
//     target: field.at('aaa'),
//     relatedTarget: field.at('aaa'),
//     currentTarget: field.at('aaa'),
//     payload: [],
//   } satisfies FieldEvent);
//   expect(aaaListenerMock).toHaveBeenNthCalledWith(3, {
//     type: 'validationFinished',
//     target: field.at('aaa'),
//     relatedTarget: field,
//     currentTarget: field.at('aaa'),
//     payload: { rootField: field, abortController: null },
//   } satisfies FieldEvent);
// });
//
// test('asynchronously validates the root field and adds errors using errorsPlugin', async () => {
//   const field = createField({ aaa: 111 }, [
//     errorsPlugin(),
//     validationPlugin({
//       async validateAsync(field) {
//         field.at('aaa').publish(new FieldEvent('errorCaught', field.at('aaa'), null, 222));
//       },
//     }),
//   ]);
//
//   const listenerMock = jest.fn();
//   const aaaListenerMock = jest.fn();
//
//   field.subscribe(listenerMock);
//   field.at('aaa').subscribe(aaaListenerMock);
//
//   const promise = field.validateAsync();
//
//   expect(promise).toBeInstanceOf(Promise);
//
//   expect(field.isValidating).toBe(true);
//   expect(field.at('aaa').isValidating).toBe(true);
//
//   await expect(promise).resolves.toEqual(false);
//
//   expect(field.isValidating).toBe(false);
//   expect(field.isInvalid).toBe(false);
//   expect(field.errors.length).toBe(0);
//
//   expect(field.at('aaa').isValidating).toBe(false);
//   expect(field.at('aaa').isInvalid).toBe(true);
//   expect(field.at('aaa').errors).toEqual([222]);
//
//   expect(listenerMock).toHaveBeenCalledTimes(5);
//   expect(listenerMock).toHaveBeenNthCalledWith(1, {
//     type: 'validationStarted',
//     target: field,
//     relatedTarget: field,
//     currentTarget: field,
//     payload: { rootField: field, abortController: expect.any(AbortController) },
//   } satisfies FieldEvent);
//   expect(listenerMock).toHaveBeenNthCalledWith(2, {
//     type: 'validationStarted',
//     target: field.at('aaa'),
//     relatedTarget: field,
//     currentTarget: field.at('aaa'),
//     payload: { rootField: field, abortController: expect.any(AbortController) },
//   } satisfies FieldEvent);
//   expect(listenerMock).toHaveBeenNthCalledWith(3, {
//     type: 'change:errors',
//     target: field.at('aaa'),
//     relatedTarget: field.at('aaa'),
//     currentTarget: field.at('aaa'),
//     payload: [],
//   } satisfies FieldEvent);
//   expect(listenerMock).toHaveBeenNthCalledWith(4, {
//     type: 'validationFinished',
//     target: field,
//     relatedTarget: field,
//     currentTarget: field,
//     payload: { rootField: field, abortController: expect.any(AbortController) },
//   } satisfies FieldEvent);
//   expect(listenerMock).toHaveBeenNthCalledWith(5, {
//     type: 'validationFinished',
//     target: field.at('aaa'),
//     relatedTarget: field,
//     currentTarget: field.at('aaa'),
//     payload: { rootField: field, abortController: expect.any(AbortController) },
//   } satisfies FieldEvent);
//
//   expect(aaaListenerMock).toHaveBeenCalledTimes(3);
//   expect(aaaListenerMock).toHaveBeenNthCalledWith(1, {
//     type: 'validationStarted',
//     target: field.at('aaa'),
//     relatedTarget: field,
//     currentTarget: field.at('aaa'),
//     payload: { rootField: field, abortController: expect.any(AbortController) },
//   } satisfies FieldEvent);
//   expect(aaaListenerMock).toHaveBeenNthCalledWith(2, {
//     type: 'change:errors',
//     target: field.at('aaa'),
//     relatedTarget: field.at('aaa'),
//     currentTarget: field.at('aaa'),
//     payload: [],
//   } satisfies FieldEvent);
//   expect(aaaListenerMock).toHaveBeenNthCalledWith(3, {
//     type: 'validationFinished',
//     target: field.at('aaa'),
//     relatedTarget: field,
//     currentTarget: field.at('aaa'),
//     payload: { rootField: field, abortController: expect.any(AbortController) },
//   } satisfies FieldEvent);
// });
