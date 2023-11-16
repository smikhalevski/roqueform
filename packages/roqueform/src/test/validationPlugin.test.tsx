import { createField, validationPlugin, Validator } from '../main';

describe('validationPlugin', () => {
  const noopValidator: Validator<unknown, unknown> = {
    validate: () => undefined,
  };

  test('enhances the field', () => {
    const field = createField({ aaa: 111 }, validationPlugin({ validator: noopValidator }));

    expect(field.errors.length).toBe(0);
    expect(field.isInvalid).toBe(false);
    expect(field.isValidating).toBe(false);
    expect(field.validator).toBe(noopValidator);
    expect(field.validation).toBeNull();

    expect(field.at('aaa').isValidating).toBe(false);
    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').errors.length).toBe(0);
  });

  test('adds an error to the root field', () => {
    const field = createField({ aaa: 111 }, validationPlugin({ validator: noopValidator }));

    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();

    const errors = field.errors;

    field.on('*', subscriberMock);
    field.at('aaa').on('*', aaaSubscriberMock);

    field.addError(222);

    expect(field.isInvalid).toBe(true);
    expect(field.errors).toEqual([222]);
    expect(field.errors).not.toBe(errors);

    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').errors.length).toBe(0);

    expect(subscriberMock).toHaveBeenCalledTimes(1);
    expect(aaaSubscriberMock).not.toHaveBeenCalled();
  });

  test('adds an error to the child field', () => {
    const field = createField({ aaa: 111 }, validationPlugin({ validator: noopValidator }));

    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();

    field.on('*', subscriberMock);
    field.at('aaa').on('*', aaaSubscriberMock);

    field.at('aaa').addError(222);

    expect(field.isInvalid).toBe(true);
    expect(field.errors.length).toBe(0);

    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').errors).toEqual([222]);

    expect(subscriberMock).toHaveBeenCalledTimes(1);
    expect(aaaSubscriberMock).toHaveBeenCalledTimes(1);
  });

  test('does not add duplicated error by default', () => {
    const field = createField({ aaa: 111 }, validationPlugin({ validator: noopValidator }));

    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();

    field.on('*', subscriberMock);
    field.at('aaa').on('*', aaaSubscriberMock);

    field.addError(222);
    field.addError(222);

    expect(field.isInvalid).toBe(true);
    expect(field.errors).toEqual([222]);

    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').errors.length).toBe(0);

    expect(subscriberMock).toHaveBeenCalledTimes(1);
    expect(aaaSubscriberMock).not.toHaveBeenCalled();
  });

  test('uses errorMerger to add a new error', () => {
    const errors = [333];
    const errorMergerMock = jest.fn(() => errors);

    const field = createField(
      { aaa: 111 },
      validationPlugin({ validator: noopValidator, errorsMerger: errorMergerMock })
    );

    field.addError(222);

    expect(field.errors).toEqual(errors);
    expect(errorMergerMock).toHaveBeenCalledTimes(1);
    expect(errorMergerMock).toHaveBeenNthCalledWith(1, [], 222);
  });

  test('deletes an error from the root field', () => {
    const field = createField({ aaa: 111 }, validationPlugin({ validator: noopValidator }));

    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();

    field.on('*', subscriberMock);
    field.at('aaa').on('*', aaaSubscriberMock);

    field.addError(222);
    field.deleteError(222);

    expect(field.isInvalid).toBe(false);
    expect(field.errors.length).toBe(0);

    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').errors.length).toBe(0);

    expect(subscriberMock).toHaveBeenCalledTimes(2);
    expect(aaaSubscriberMock).not.toHaveBeenCalled();
  });

  test('deletes an error from the child field', () => {
    const field = createField({ aaa: 111 }, validationPlugin({ validator: noopValidator }));

    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();

    field.on('*', subscriberMock);
    field.at('aaa').on('*', aaaSubscriberMock);

    field.at('aaa').addError(222);
    field.at('aaa').deleteError(222);

    expect(field.isInvalid).toBe(false);
    expect(field.errors.length).toBe(0);

    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').errors.length).toBe(0);

    expect(subscriberMock).toHaveBeenCalledTimes(2);
    expect(aaaSubscriberMock).toHaveBeenCalledTimes(2);
  });

  test('deletes an error from the child field but parent remains invalid', () => {
    const field = createField({ aaa: 111, bbb: 222 }, validationPlugin({ validator: noopValidator }));

    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();
    const bbbSubscriberMock = jest.fn();

    field.on('*', subscriberMock);
    field.at('aaa').on('*', aaaSubscriberMock);
    field.at('bbb').on('*', bbbSubscriberMock);

    field.at('aaa').addError(333);
    field.at('bbb').addError(444);

    field.at('bbb').deleteError(444);

    expect(field.isInvalid).toBe(true);
    expect(field.errors.length).toBe(0);

    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').errors).toEqual([333]);

    expect(field.at('bbb').isInvalid).toBe(false);
    expect(field.at('bbb').errors.length).toBe(0);

    expect(subscriberMock).toHaveBeenCalledTimes(3);
    expect(aaaSubscriberMock).toHaveBeenCalledTimes(1);
    expect(bbbSubscriberMock).toHaveBeenCalledTimes(2);
  });

  test('clears all errors', () => {
    const field = createField({ aaa: 111, bbb: 222 }, validationPlugin({ validator: noopValidator }));

    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();
    const bbbSubscriberMock = jest.fn();

    field.on('*', subscriberMock);
    field.at('aaa').on('*', aaaSubscriberMock);
    field.at('bbb').on('*', bbbSubscriberMock);

    field.at('aaa').addError(333);
    field.at('bbb').addError(444);

    field.clearAllErrors();

    expect(field.isInvalid).toBe(false);
    expect(field.errors.length).toBe(0);

    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').errors.length).toBe(0);

    expect(field.at('bbb').isInvalid).toBe(false);
    expect(field.at('bbb').errors.length).toBe(0);

    expect(subscriberMock).toHaveBeenCalledTimes(4);
    expect(aaaSubscriberMock).toHaveBeenCalledTimes(2);
    expect(bbbSubscriberMock).toHaveBeenCalledTimes(2);
  });

  test('clears errors from nested fields', () => {
    const field = createField(
      {
        aaa: {
          bbb: {
            ccc: 111,
            ddd: 222,
          },
        },
      },
      validationPlugin({ validator: noopValidator })
    );

    field.at('aaa').at('bbb').at('ccc').addError(333);
    field.at('aaa').at('bbb').at('ddd').addError(444);

    field.clearAllErrors();

    expect(field.isInvalid).toBe(false);
    expect(field.errors.length).toBe(0);

    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').at('bbb').isInvalid).toBe(false);
    expect(field.at('aaa').at('bbb').at('ccc').isInvalid).toBe(false);
    expect(field.at('aaa').at('bbb').at('ddd').isInvalid).toBe(false);
  });

  test('synchronously validates the root field', () => {
    const field = createField(
      { aaa: 111 },
      validationPlugin({
        validator: {
          validate(field) {
            field.at('aaa').addError(222);
          },
        },
      })
    );

    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();

    field.on('*', subscriberMock);
    field.at('aaa').on('*', aaaSubscriberMock);

    expect(field.validate()).toBe(false);

    expect(field.isValidating).toBe(false);
    expect(field.isInvalid).toBe(true);
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

  test('synchronously validates the root field with a callback validator', () => {
    const field = createField(
      { aaa: 111 },
      validationPlugin({
        validator: field => {
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
    expect(field.isInvalid).toBe(true);
    expect(field.errors.length).toBe(0);

    expect(field.at('aaa').isValidating).toBe(false);
    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').errors).toEqual([222]);

    expect(subscriberMock).toHaveBeenCalledTimes(5);
    expect(aaaSubscriberMock).toHaveBeenCalledTimes(3);
  });

  test('synchronously validates the child field', () => {
    const field = createField(
      { aaa: 111 },
      validationPlugin({
        validator: {
          validate(field) {
            field.addError(222);
          },
        },
      })
    );

    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();

    field.on('*', subscriberMock);
    field.at('aaa').on('*', aaaSubscriberMock);

    field.at('aaa').validate();

    expect(field.isValidating).toBe(false);
    expect(field.isInvalid).toBe(true);
    expect(field.errors.length).toBe(0);

    expect(field.at('aaa').isValidating).toBe(false);
    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').errors).toEqual([222]);

    expect(subscriberMock).toHaveBeenCalledTimes(3);
    expect(subscriberMock).toHaveBeenNthCalledWith(1, {
      type: 'validation:start',
      targetField: field.at('aaa'),
      originField: field.at('aaa'),
      data: { rootField: field.at('aaa'), abortController: null },
    });
    expect(subscriberMock).toHaveBeenNthCalledWith(2, {
      type: 'change:errors',
      targetField: field.at('aaa'),
      originField: field.at('aaa'),
      data: [],
    });
    expect(subscriberMock).toHaveBeenNthCalledWith(3, {
      type: 'validation:end',
      targetField: field.at('aaa'),
      originField: field.at('aaa'),
      data: { rootField: field.at('aaa'), abortController: null },
    });

    expect(aaaSubscriberMock).toHaveBeenCalledTimes(3);
    expect(aaaSubscriberMock).toHaveBeenNthCalledWith(1, {
      type: 'validation:start',
      targetField: field.at('aaa'),
      originField: field.at('aaa'),
      data: { rootField: field.at('aaa'), abortController: null },
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
      originField: field.at('aaa'),
      data: { rootField: field.at('aaa'), abortController: null },
    });
  });

  test('synchronously validates multiple fields', () => {
    const field = createField(
      { aaa: 111, bbb: 222 },
      validationPlugin({
        validator: {
          validate(field) {
            field.at('aaa').addError(333);
            field.at('bbb').addError(444);
          },
        },
      })
    );

    field.validate();

    expect(field.isInvalid).toBe(true);
    expect(field.errors.length).toBe(0);

    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').errors).toEqual([333]);

    expect(field.at('bbb').isInvalid).toBe(true);
    expect(field.at('bbb').errors).toEqual([444]);
  });

  test('asynchronously validates the root field', async () => {
    const field = createField(
      { aaa: 111 },
      validationPlugin({
        validator: {
          validate: () => undefined,

          async validateAsync(field) {
            field.at('aaa').addError(222);
          },
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
    expect(field.isInvalid).toBe(true);
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

  test('asynchronously validates the child field', async () => {
    const field = createField(
      { aaa: 111 },
      validationPlugin({
        validator: {
          validate: () => undefined,

          async validateAsync(field) {
            field.addError(222);
          },
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
    expect(field.isInvalid).toBe(true);
    expect(field.errors.length).toBe(0);

    expect(field.at('aaa').isValidating).toBe(false);
    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').errors).toEqual([222]);

    expect(subscriberMock).toHaveBeenCalledTimes(3);
    expect(aaaSubscriberMock).toHaveBeenCalledTimes(3);
  });

  test('cleans up validation if a sync error is thrown', () => {
    const field = createField(
      { aaa: 111, bbb: 222 },
      validationPlugin({
        validator: {
          validate() {
            throw new Error('expected');
          },
        },
      })
    );

    field.at('aaa');

    expect(() => field.validate()).toThrow(new Error('expected'));

    expect(field.isValidating).toBe(false);
    expect(field.isInvalid).toBe(false);
    expect(field.errors.length).toBe(0);

    expect(field.at('aaa').isValidating).toBe(false);
    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').errors.length).toBe(0);
  });

  test('cleans up validation if an async error is thrown', async () => {
    const field = createField(
      { aaa: 111, bbb: 222 },
      validationPlugin({
        validator: {
          validate: () => undefined,

          async validateAsync() {
            throw new Error('expected');
          },
        },
      })
    );

    field.at('aaa');

    const promise = field.validateAsync();

    await expect(promise).rejects.toEqual(new Error('expected'));

    expect(field.isValidating).toBe(false);
    expect(field.isInvalid).toBe(false);
    expect(field.errors.length).toBe(0);

    expect(field.at('aaa').isValidating).toBe(false);
    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').errors.length).toBe(0);
  });

  test('aborts validation', async () => {
    let lastSignal: AbortSignal | undefined;

    const field = createField(
      { aaa: 111, bbb: 222 },
      validationPlugin({
        validator: {
          validate: () => undefined,

          async validateAsync(field) {
            lastSignal = field.validation!.abortController!.signal;
          },
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
        validator: {
          validate: () => undefined,

          async validateAsync(field) {
            signals.push(field.validation!.abortController!.signal);
          },
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
        validator: {
          validate: () => undefined,

          async validateAsync(field) {
            signals.push(field.validation!.abortController!.signal);
          },
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
    const field = createField({ aaa: 111 }, validationPlugin({ validator: noopValidator }));

    const subscriberMock = jest.fn(() => {
      field.validate();
    });

    field.on('change:value', subscriberMock);

    field.at('aaa').setValue(222);

    expect(subscriberMock).toHaveBeenCalledTimes(2);
  });
});
