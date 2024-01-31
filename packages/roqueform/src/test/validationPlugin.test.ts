import { createField, errorsPlugin, validationPlugin } from '../main';

describe('validationPlugin', () => {
  test('synchronously validates the root field', () => {
    const field = createField(
      { aaa: 111 },
      validationPlugin({
        validate(field) {
          field.at('aaa').isInvalid = true;
        },
      })
    );

    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();

    field.on('*', subscriberMock);
    field.at('aaa').on('*', aaaSubscriberMock);

    expect(field.validate()).toBe(false);

    expect(field.isValidating).toBe(false);
    expect(field.isInvalid).toBe(undefined);

    expect(field.at('aaa').isValidating).toBe(false);
    expect(field.at('aaa').isInvalid).toBe(true);

    expect(subscriberMock).toHaveBeenCalledTimes(4);
    expect(subscriberMock).toHaveBeenNthCalledWith(1, {
      type: 'validation:start',
      targetField: field,
      originField: field,
      data: { rootField: field, abortController: null },
    });
    expect(subscriberMock).toHaveBeenNthCalledWith(2, {
      type: 'validation:start',
      targetField: field.at('aaa'),
      originField: field,
      data: { rootField: field, abortController: null },
    });
    expect(subscriberMock).toHaveBeenNthCalledWith(3, {
      type: 'validation:end',
      targetField: field,
      originField: field,
      data: { rootField: field, abortController: null },
    });
    expect(subscriberMock).toHaveBeenNthCalledWith(4, {
      type: 'validation:end',
      targetField: field.at('aaa'),
      originField: field,
      data: { rootField: field, abortController: null },
    });

    expect(aaaSubscriberMock).toHaveBeenCalledTimes(2);
    expect(aaaSubscriberMock).toHaveBeenNthCalledWith(1, {
      type: 'validation:start',
      targetField: field.at('aaa'),
      originField: field,
      data: { rootField: field, abortController: null },
    });
    expect(aaaSubscriberMock).toHaveBeenNthCalledWith(2, {
      type: 'validation:end',
      targetField: field.at('aaa'),
      originField: field,
      data: { rootField: field, abortController: null },
    });
  });

  test('synchronously validates the child field', () => {
    const field = createField(
      { aaa: 111 },
      validationPlugin({
        validate(field) {
          field.isInvalid = true;
        },
      })
    );

    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();

    field.on('*', subscriberMock);
    field.at('aaa').on('*', aaaSubscriberMock);

    field.at('aaa').validate();

    expect(field.isValidating).toBe(false);
    expect(field.isInvalid).toBe(undefined);

    expect(field.at('aaa').isValidating).toBe(false);
    expect(field.at('aaa').isInvalid).toBe(true);

    expect(subscriberMock).toHaveBeenCalledTimes(2);
    expect(subscriberMock).toHaveBeenNthCalledWith(1, {
      type: 'validation:start',
      targetField: field.at('aaa'),
      originField: field.at('aaa'),
      data: { rootField: field.at('aaa'), abortController: null },
    });
    expect(subscriberMock).toHaveBeenNthCalledWith(2, {
      type: 'validation:end',
      targetField: field.at('aaa'),
      originField: field.at('aaa'),
      data: { rootField: field.at('aaa'), abortController: null },
    });

    expect(aaaSubscriberMock).toHaveBeenCalledTimes(2);
    expect(aaaSubscriberMock).toHaveBeenNthCalledWith(1, {
      type: 'validation:start',
      targetField: field.at('aaa'),
      originField: field.at('aaa'),
      data: { rootField: field.at('aaa'), abortController: null },
    });
    expect(aaaSubscriberMock).toHaveBeenNthCalledWith(2, {
      type: 'validation:end',
      targetField: field.at('aaa'),
      originField: field.at('aaa'),
      data: { rootField: field.at('aaa'), abortController: null },
    });
  });

  test('asynchronously validates the root field', async () => {
    const field = createField(
      { aaa: 111 },
      validationPlugin({
        async validateAsync(field) {
          field.at('aaa').isInvalid = true;
        },
      })
    );

    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();

    field.on('*', subscriberMock);
    field.at('aaa').on('*', aaaSubscriberMock);

    const promise = field.validateAsync();

    expect(promise).toBeInstanceOf(Promise);

    expect(field.isValidating).toBe(true);
    expect(field.at('aaa').isValidating).toBe(true);

    await expect(promise).resolves.toEqual(false);

    expect(field.isValidating).toBe(false);
    expect(field.isInvalid).toBe(undefined);

    expect(field.at('aaa').isValidating).toBe(false);
    expect(field.at('aaa').isInvalid).toBe(true);

    expect(subscriberMock).toHaveBeenCalledTimes(4);
    expect(subscriberMock).toHaveBeenNthCalledWith(1, {
      type: 'validation:start',
      targetField: field,
      originField: field,
      data: { rootField: field, abortController: expect.any(AbortController) },
    });
    expect(subscriberMock).toHaveBeenNthCalledWith(2, {
      type: 'validation:start',
      targetField: field.at('aaa'),
      originField: field,
      data: { rootField: field, abortController: expect.any(AbortController) },
    });
    expect(subscriberMock).toHaveBeenNthCalledWith(3, {
      type: 'validation:end',
      targetField: field,
      originField: field,
      data: { rootField: field, abortController: expect.any(AbortController) },
    });
    expect(subscriberMock).toHaveBeenNthCalledWith(4, {
      type: 'validation:end',
      targetField: field.at('aaa'),
      originField: field,
      data: { rootField: field, abortController: expect.any(AbortController) },
    });

    expect(aaaSubscriberMock).toHaveBeenCalledTimes(2);
    expect(aaaSubscriberMock).toHaveBeenNthCalledWith(1, {
      type: 'validation:start',
      targetField: field.at('aaa'),
      originField: field,
      data: { rootField: field, abortController: expect.any(AbortController) },
    });
    expect(aaaSubscriberMock).toHaveBeenNthCalledWith(2, {
      type: 'validation:end',
      targetField: field.at('aaa'),
      originField: field,
      data: { rootField: field, abortController: expect.any(AbortController) },
    });
  });

  test('asynchronously validates the child field', async () => {
    const field = createField(
      { aaa: 111 },
      validationPlugin({
        async validateAsync(field) {
          field.isInvalid = true;
        },
      })
    );

    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();

    field.on('*', subscriberMock);
    field.at('aaa').on('*', aaaSubscriberMock);

    const promise = field.at('aaa').validateAsync();

    expect(field.isValidating).toBe(false);
    expect(field.at('aaa').isValidating).toBe(true);

    await expect(promise).resolves.toEqual(false);

    expect(field.isValidating).toBe(false);
    expect(field.isInvalid).toBe(undefined);

    expect(field.at('aaa').isValidating).toBe(false);
    expect(field.at('aaa').isInvalid).toBe(true);

    expect(subscriberMock).toHaveBeenCalledTimes(2);
    expect(aaaSubscriberMock).toHaveBeenCalledTimes(2);
  });

  test('cleans up validation if a sync error is thrown', () => {
    const field = createField(
      { aaa: 111, bbb: 222 },
      validationPlugin({
        validate() {
          throw new Error('expected');
        },
      })
    );

    field.at('aaa');

    expect(() => field.validate()).toThrow(new Error('expected'));

    expect(field.isValidating).toBe(false);
    expect(field.isInvalid).toBe(undefined);

    expect(field.at('aaa').isValidating).toBe(false);
    expect(field.at('aaa').isInvalid).toBe(undefined);
  });

  test('cleans up validation if an async error is thrown', async () => {
    const field = createField(
      { aaa: 111, bbb: 222 },
      validationPlugin({
        async validateAsync() {
          throw new Error('expected');
        },
      })
    );

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

    const field = createField(
      { aaa: 111, bbb: 222 },
      validationPlugin({
        async validateAsync(field) {
          lastSignal = field.validation!.abortController!.signal;
        },
      })
    );

    const promise = field.validateAsync();

    expect(field.isValidating).toBe(true);
    expect(field.at('aaa').isValidating).toBe(true);

    field.abortValidation();

    expect(lastSignal!.aborted).toBe(true);
    expect(field.isValidating).toBe(false);
    expect(field.at('aaa').isValidating).toBe(false);

    await expect(promise).rejects.toEqual(new Error('Validation aborted'));
  });

  test('aborts pending validation when invoked on the same field', async () => {
    const signals: AbortSignal[] = [];

    const field = createField(
      { aaa: 111, bbb: 222 },
      validationPlugin({
        async validateAsync(field) {
          signals.push(field.validation!.abortController!.signal);
        },
      })
    );

    const promise = field.validateAsync();

    field.validateAsync();

    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);

    await expect(promise).rejects.toEqual(new Error('Validation aborted'));
  });

  test('child field validation aborts the parent validation', async () => {
    const signals: AbortSignal[] = [];

    const field = createField(
      { aaa: 111, bbb: 222 },
      validationPlugin({
        async validateAsync(field) {
          signals.push(field.validation!.abortController!.signal);
        },
      })
    );

    const promise = field.validateAsync();
    const aaaPromise = field.at('aaa').validateAsync();

    await expect(promise).rejects.toEqual(new Error('Validation aborted'));
    await expect(aaaPromise).resolves.toBe(true);

    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
  });

  test('validation can be called in value change subscriber', () => {
    const field = createField(
      { aaa: 111 },
      validationPlugin({
        validate() {},
      })
    );

    const subscriberMock = jest.fn(() => {
      field.validate();
    });

    field.on('change:value', subscriberMock);

    field.at('aaa').setValue(222);

    expect(subscriberMock).toHaveBeenCalledTimes(2);
  });

  test('synchronously validates the root field and adds errors using errorsPlugin', () => {
    const field = createField(
      { aaa: 111 },
      validationPlugin(errorsPlugin(), {
        validate(field) {
          field.at('aaa').addError(222);
        },
      })
    );

    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();

    field.on('*', subscriberMock);
    field.at('aaa').on('*', aaaSubscriberMock);

    expect(field.validate()).toBe(false);

    expect(field.isValidating).toBe(false);
    expect(field.isInvalid).toBe(false);
    expect(field.errors.length).toBe(0);

    expect(field.at('aaa').isValidating).toBe(false);
    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').errors).toEqual([222]);

    expect(subscriberMock).toHaveBeenCalledTimes(5);
    expect(subscriberMock).toHaveBeenNthCalledWith(1, {
      type: 'validation:start',
      targetField: field,
      originField: field,
      data: { rootField: field, abortController: null },
    });
    expect(subscriberMock).toHaveBeenNthCalledWith(2, {
      type: 'validation:start',
      targetField: field.at('aaa'),
      originField: field,
      data: { rootField: field, abortController: null },
    });
    expect(subscriberMock).toHaveBeenNthCalledWith(3, {
      type: 'change:errors',
      targetField: field.at('aaa'),
      originField: field.at('aaa'),
      data: [],
    });
    expect(subscriberMock).toHaveBeenNthCalledWith(4, {
      type: 'validation:end',
      targetField: field,
      originField: field,
      data: { rootField: field, abortController: null },
    });
    expect(subscriberMock).toHaveBeenNthCalledWith(5, {
      type: 'validation:end',
      targetField: field.at('aaa'),
      originField: field,
      data: { rootField: field, abortController: null },
    });

    expect(aaaSubscriberMock).toHaveBeenCalledTimes(3);
    expect(aaaSubscriberMock).toHaveBeenNthCalledWith(1, {
      type: 'validation:start',
      targetField: field.at('aaa'),
      originField: field,
      data: { rootField: field, abortController: null },
    });
    expect(aaaSubscriberMock).toHaveBeenNthCalledWith(2, {
      type: 'change:errors',
      targetField: field.at('aaa'),
      originField: field.at('aaa'),
      data: [],
    });
    expect(aaaSubscriberMock).toHaveBeenNthCalledWith(3, {
      type: 'validation:end',
      targetField: field.at('aaa'),
      originField: field,
      data: { rootField: field, abortController: null },
    });
  });

  test('asynchronously validates the root field and adds errors using errorsPlugin', async () => {
    const field = createField(
      { aaa: 111 },
      validationPlugin(errorsPlugin(), {
        async validateAsync(field) {
          field.at('aaa').addError(222);
        },
      })
    );

    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();

    field.on('*', subscriberMock);
    field.at('aaa').on('*', aaaSubscriberMock);

    const promise = field.validateAsync();

    expect(promise).toBeInstanceOf(Promise);

    expect(field.isValidating).toBe(true);
    expect(field.at('aaa').isValidating).toBe(true);

    await expect(promise).resolves.toEqual(false);

    expect(field.isValidating).toBe(false);
    expect(field.isInvalid).toBe(false);
    expect(field.errors.length).toBe(0);

    expect(field.at('aaa').isValidating).toBe(false);
    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').errors).toEqual([222]);

    expect(subscriberMock).toHaveBeenCalledTimes(5);
    expect(subscriberMock).toHaveBeenNthCalledWith(1, {
      type: 'validation:start',
      targetField: field,
      originField: field,
      data: { rootField: field, abortController: expect.any(AbortController) },
    });
    expect(subscriberMock).toHaveBeenNthCalledWith(2, {
      type: 'validation:start',
      targetField: field.at('aaa'),
      originField: field,
      data: { rootField: field, abortController: expect.any(AbortController) },
    });
    expect(subscriberMock).toHaveBeenNthCalledWith(3, {
      type: 'change:errors',
      targetField: field.at('aaa'),
      originField: field.at('aaa'),
      data: [],
    });
    expect(subscriberMock).toHaveBeenNthCalledWith(4, {
      type: 'validation:end',
      targetField: field,
      originField: field,
      data: { rootField: field, abortController: expect.any(AbortController) },
    });
    expect(subscriberMock).toHaveBeenNthCalledWith(5, {
      type: 'validation:end',
      targetField: field.at('aaa'),
      originField: field,
      data: { rootField: field, abortController: expect.any(AbortController) },
    });

    expect(aaaSubscriberMock).toHaveBeenCalledTimes(3);
    expect(aaaSubscriberMock).toHaveBeenNthCalledWith(1, {
      type: 'validation:start',
      targetField: field.at('aaa'),
      originField: field,
      data: { rootField: field, abortController: expect.any(AbortController) },
    });
    expect(aaaSubscriberMock).toHaveBeenNthCalledWith(2, {
      type: 'change:errors',
      targetField: field.at('aaa'),
      originField: field.at('aaa'),
      data: [],
    });
    expect(aaaSubscriberMock).toHaveBeenNthCalledWith(3, {
      type: 'validation:end',
      targetField: field.at('aaa'),
      originField: field,
      data: { rootField: field, abortController: expect.any(AbortController) },
    });
  });
});
