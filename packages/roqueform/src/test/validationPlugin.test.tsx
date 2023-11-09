import { createField, validationPlugin, Validator } from '../main';

describe('validationPlugin', () => {
  const noopValidator: Validator<unknown, unknown> = {
    validate: () => undefined,
  };

  test('enhances the field', () => {
    const field = createField({ aaa: 111 }, validationPlugin(noopValidator));

    expect(field.error).toBe(null);
    expect(field.isInvalid).toBe(false);
    expect(field.isValidating).toBe(false);
    expect(field.errorCount).toBe(0);
    expect(field.errorOrigin).toBe(0);
    expect(field.validator).toBe(noopValidator);
    expect(field.validation).toBeNull();

    expect(field.at('aaa').isValidating).toBe(false);
    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').error).toBeNull();
  });

  test('sets an error to the root field', () => {
    const field = createField({ aaa: 111 }, validationPlugin(noopValidator));

    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();

    field.on('*', subscriberMock);
    field.at('aaa').on('*', aaaSubscriberMock);

    field.setError(222);

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBe(222);
    expect(field.errorCount).toBe(1);
    expect(field.errorOrigin).toBe(2);

    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').error).toBeNull();

    expect(subscriberMock).toHaveBeenCalledTimes(1);
    expect(aaaSubscriberMock).not.toHaveBeenCalled();
  });

  test('sets an error to the child field', () => {
    const field = createField({ aaa: 111 }, validationPlugin(noopValidator));

    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();

    field.on('*', subscriberMock);
    field.at('aaa').on('*', aaaSubscriberMock);

    field.at('aaa').setError(222);

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBeNull();
    expect(field.errorCount).toBe(1);
    expect(field.errorOrigin).toBe(0);

    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').error).toBe(222);
    expect(field.at('aaa').errorCount).toBe(1);
    expect(field.at('aaa').errorOrigin).toBe(2);

    expect(subscriberMock).toHaveBeenCalledTimes(1);
    expect(aaaSubscriberMock).toHaveBeenCalledTimes(1);
  });

  test('deletes an error if null is set', () => {
    const field = createField({ aaa: 111 }, validationPlugin(noopValidator));

    field.setError(222);
    field.setError(null);

    expect(field.isInvalid).toBe(false);
    expect(field.error).toBeNull();

    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').error).toBeNull();
  });

  test('deletes an error from the root field', () => {
    const field = createField({ aaa: 111 }, validationPlugin(noopValidator));

    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();

    field.on('*', subscriberMock);
    field.at('aaa').on('*', aaaSubscriberMock);

    field.setError(111);
    field.deleteError();

    expect(field.isInvalid).toBe(false);
    expect(field.error).toBeNull();

    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').error).toBeNull();

    expect(subscriberMock).toHaveBeenCalledTimes(2);
    expect(aaaSubscriberMock).not.toHaveBeenCalled();
  });

  test('deletes an error from the child field', () => {
    const field = createField({ aaa: 111 }, validationPlugin(noopValidator));

    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();

    field.on('*', subscriberMock);
    field.at('aaa').on('*', aaaSubscriberMock);

    field.at('aaa').setError(222);
    field.at('aaa').deleteError();

    expect(field.isInvalid).toBe(false);
    expect(field.error).toBeNull();

    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').error).toBeNull();

    expect(subscriberMock).toHaveBeenCalledTimes(2);
    expect(aaaSubscriberMock).toHaveBeenCalledTimes(2);
  });

  test('deletes an error from the child field but parent remains invalid', () => {
    const field = createField({ aaa: 111, bbb: 222 }, validationPlugin(noopValidator));

    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();
    const bbbSubscriberMock = jest.fn();

    field.on('*', subscriberMock);
    field.at('aaa').on('*', aaaSubscriberMock);
    field.at('bbb').on('*', bbbSubscriberMock);

    field.at('aaa').setError(333);
    field.at('bbb').setError(444);

    field.at('bbb').deleteError();

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBeNull();

    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').error).toBe(333);

    expect(field.at('bbb').isInvalid).toBe(false);
    expect(field.at('bbb').error).toBeNull();

    expect(subscriberMock).toHaveBeenCalledTimes(1);
    expect(aaaSubscriberMock).toHaveBeenCalledTimes(1);
    expect(bbbSubscriberMock).toHaveBeenCalledTimes(2);
  });

  test('clears all errors', () => {
    const field = createField({ aaa: 111, bbb: 222 }, validationPlugin(noopValidator));

    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();
    const bbbSubscriberMock = jest.fn();

    field.on('*', subscriberMock);
    field.at('aaa').on('*', aaaSubscriberMock);
    field.at('bbb').on('*', bbbSubscriberMock);

    field.at('aaa').setError(333);
    field.at('bbb').setError(444);

    field.clearErrors();

    expect(field.isInvalid).toBe(false);
    expect(field.error).toBeNull();

    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').error).toBeNull();

    expect(field.at('bbb').isInvalid).toBe(false);
    expect(field.at('bbb').error).toBeNull();

    expect(subscriberMock).toHaveBeenCalledTimes(2);
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
      validationPlugin(noopValidator)
    );

    field.at('aaa').at('bbb').at('ccc').setError(333);
    field.at('aaa').at('bbb').at('ddd').setError(444);

    field.clearErrors();

    expect(field.isInvalid).toBe(false);
    expect(field.error).toBeNull();

    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').at('bbb').isInvalid).toBe(false);
    expect(field.at('aaa').at('bbb').at('ccc').isInvalid).toBe(false);
    expect(field.at('aaa').at('bbb').at('ddd').isInvalid).toBe(false);
  });

  test('synchronously validates the root field', () => {
    const field = createField(
      { aaa: 111 },
      validationPlugin({
        validate(field) {
          field.at('aaa').setValidationError(field.validation!, 222);
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
    expect(field.error).toBeNull();

    expect(field.at('aaa').isValidating).toBe(false);
    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').error).toBe(222);

    expect(subscriberMock).toHaveBeenCalledTimes(3);
    expect(subscriberMock).toHaveBeenNthCalledWith(1, {
      type: 'validation:start',
      origin: field,
      target: field,
      data: undefined,
    });
    expect(subscriberMock).toHaveBeenNthCalledWith(2, {
      type: 'change:error',
      origin: field.at('aaa'),
      target: field,
      data: null,
    });
    expect(subscriberMock).toHaveBeenNthCalledWith(3, {
      type: 'validation:end',
      origin: field,
      target: field,
      data: undefined,
    });

    expect(aaaSubscriberMock).toHaveBeenCalledTimes(3);
  });

  test('synchronously validates the root field with a callback validator', () => {
    const field = createField(
      { aaa: 111 },
      validationPlugin(field => {
        field.at('aaa').setValidationError(field.validation!, 222);
      })
    );

    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();

    field.on('*', subscriberMock);
    field.at('aaa').on('*', aaaSubscriberMock);

    expect(field.validate()).toBe(false);

    expect(field.isValidating).toBe(false);
    expect(field.isInvalid).toBe(true);
    expect(field.error).toBeNull();

    expect(field.at('aaa').isValidating).toBe(false);
    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').error).toBe(222);

    expect(subscriberMock).toHaveBeenCalledTimes(3);
    expect(aaaSubscriberMock).toHaveBeenCalledTimes(3);
  });

  test('synchronously validates the child field', () => {
    const field = createField(
      { aaa: 111 },
      validationPlugin({
        validate(field) {
          field.setValidationError(field.validation!, 222);
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
    expect(field.error).toBeNull();

    expect(field.at('aaa').isValidating).toBe(false);
    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').error).toBe(222);

    expect(subscriberMock).toHaveBeenCalledTimes(1);
    expect(subscriberMock).toHaveBeenNthCalledWith(1, {
      type: 'change:error',
      origin: field.at('aaa'),
      target: field,
      data: null,
    });

    expect(aaaSubscriberMock).toHaveBeenCalledTimes(3);
  });

  test('synchronously validates multiple fields', () => {
    const field = createField(
      { aaa: 111, bbb: 222 },
      validationPlugin({
        validate(field) {
          field.at('aaa').setValidationError(field.validation!, 333);
          field.at('bbb').setValidationError(field.validation!, 444);
        },
      })
    );

    field.validate();

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBeNull();

    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').error).toBe(333);

    expect(field.at('bbb').isInvalid).toBe(true);
    expect(field.at('bbb').error).toBe(444);
  });

  test('clears previous validation errors before validation', () => {
    const validateMock = jest.fn();

    validateMock.mockImplementationOnce(field => {
      field.at('aaa').setValidationError(field.validation, 111);
      field.at('bbb').setValidationError(field.validation, 222);
    });

    validateMock.mockImplementationOnce(field => {
      field.at('aaa').setValidationError(field.validation, 111);
    });

    const field = createField(
      { aaa: 0, bbb: 'ddd' },
      validationPlugin({
        validate: validateMock,
      })
    );

    field.validate();
    field.validate();

    expect(validateMock).toHaveBeenCalledTimes(2);

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBeNull();

    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').error).toBe(111);

    expect(field.at('bbb').isInvalid).toBe(false);
    expect(field.at('bbb').error).toBeNull();
  });

  test('does not clear an error set by the user before validation', () => {
    const field = createField(
      { aaa: 0, bbb: 'ddd' },
      validationPlugin({
        validate(field) {
          field.at('aaa').setValidationError(field.validation!, 111);
        },
      })
    );

    field.at('bbb').setError(222);

    field.validate();

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBeNull();

    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').error).toEqual(111);

    expect(field.at('bbb').isInvalid).toBe(true);
    expect(field.at('bbb').error).toBe(222);
  });

  test('does not set validation errors for transient fields', () => {
    const field = createField(
      { aaa: 0, bbb: 'ddd' },
      validationPlugin({
        validate(field) {
          field.at('aaa').setValidationError(field.validation!, 111);
          field.at('bbb').setValidationError(field.validation!, 222);
        },
      })
    );

    field.at('bbb').setTransientValue('');

    field.validate();

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBeNull();

    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').error).toBe(111);

    expect(field.at('bbb').isInvalid).toBe(false);
    expect(field.at('bbb').error).toBeNull();
  });

  test('asynchronously validates the root field', async () => {
    const field = createField(
      { aaa: 111 },
      validationPlugin({
        validate: () => undefined,

        async validateAsync(field) {
          field.at('aaa').setValidationError(field.validation!, 222);
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
    expect(field.error).toBeNull();

    expect(field.at('aaa').isValidating).toBe(false);
    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').error).toBe(222);

    expect(subscriberMock).toHaveBeenCalledTimes(3);
    expect(aaaSubscriberMock).toHaveBeenCalledTimes(3);
  });

  test('asynchronously validates the child field', async () => {
    const field = createField(
      { aaa: 111 },
      validationPlugin({
        validate: () => undefined,

        async validateAsync(field) {
          field.setValidationError(field.validation!, 222);
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
    expect(field.error).toBeNull();

    expect(field.at('aaa').isValidating).toBe(false);
    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').error).toBe(222);

    expect(subscriberMock).toHaveBeenCalledTimes(1);
    expect(aaaSubscriberMock).toHaveBeenCalledTimes(3);
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
    expect(field.isInvalid).toBe(false);
    expect(field.error).toBeNull();

    expect(field.at('aaa').isValidating).toBe(false);
    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').error).toBeNull();
  });

  test('cleans up validation if an async error is thrown', async () => {
    const field = createField(
      { aaa: 111, bbb: 222 },
      validationPlugin({
        validate: () => undefined,

        async validateAsync() {
          throw new Error('expected');
        },
      })
    );

    field.at('aaa');

    const promise = field.validateAsync();

    await expect(promise).rejects.toEqual(new Error('expected'));

    expect(field.isValidating).toBe(false);
    expect(field.isInvalid).toBe(false);
    expect(field.error).toBeNull();

    expect(field.at('aaa').isValidating).toBe(false);
    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').error).toBeNull();
  });

  test('aborts validation', async () => {
    let lastSignal: AbortSignal | undefined;

    const field = createField(
      { aaa: 111, bbb: 222 },
      validationPlugin({
        validate: () => undefined,

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
        validate: () => undefined,

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
        validate: () => undefined,

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

  test('does not apply errors from the aborted validation', async () => {
    const validateAsyncMock = jest.fn();

    validateAsyncMock.mockImplementationOnce(async field => {
      field.at('aaa').setValidationError(field.validation, 333);
    });

    validateAsyncMock.mockImplementationOnce(async field => {
      field.at('bbb').setValidationError(field.validation, 444);
    });

    const field = createField(
      { aaa: 111, bbb: 222 },
      validationPlugin({
        validate: () => undefined,
        validateAsync: validateAsyncMock,
      })
    );

    const promise = field.validateAsync();

    await field.validateAsync();

    expect(field.at('aaa').error).toBeNull();
    expect(field.at('bbb').error).toBe(444);

    await expect(promise).rejects.toEqual(new Error('Validation aborted'));
  });

  test('validation can be called in value change subscriber', () => {
    const field = createField({ aaa: 111 }, validationPlugin(noopValidator));

    const subscriberMock = jest.fn(() => {
      field.validate();
    });

    field.on('change:value', subscriberMock);

    field.at('aaa').setValue(222);

    expect(subscriberMock).toHaveBeenCalledTimes(1);
  });
});
