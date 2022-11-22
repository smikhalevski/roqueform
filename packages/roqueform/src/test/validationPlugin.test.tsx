import { createField, objectAccessor, validationPlugin, Validator } from '../main';

describe('validationPlugin', () => {
  const validatorStub: Validator<unknown, unknown> = {
    validate(field) {
      return { ok: true, value: field.value };
    },
    validateAsync(field) {
      return Promise.resolve({ ok: true, value: field.value });
    },
  };

  test('enhances the field', () => {
    const field = createField(objectAccessor, { foo: 0 }, validationPlugin(validatorStub));

    expect(field.validating).toBe(false);
    expect(field.invalid).toBe(false);
    expect(field.error).toBe(null);

    expect(field.at('foo').validating).toBe(false);
    expect(field.at('foo').invalid).toBe(false);
    expect(field.at('foo').error).toBe(null);
  });

  test('sets an error to the root field', () => {
    const field = createField(objectAccessor, { foo: 0 }, validationPlugin(validatorStub));

    const notifySpy = jest.spyOn(field, 'notify');
    const fooNotifySpy = jest.spyOn(field.at('foo'), 'notify');

    field.setError(111);

    expect(field.invalid).toBe(true);
    expect(field.error).toBe(111);

    expect(field.at('foo').invalid).toBe(false);
    expect(field.at('foo').error).toBe(null);

    expect(notifySpy).toHaveBeenCalledTimes(1);
    expect(fooNotifySpy).not.toHaveBeenCalled();
  });

  test('sets an error to the child field', () => {
    const field = createField(objectAccessor, { foo: 0 }, validationPlugin(validatorStub));

    const notifySpy = jest.spyOn(field, 'notify');
    const fooNotifySpy = jest.spyOn(field.at('foo'), 'notify');

    field.at('foo').setError(111);

    expect(field.invalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(true);
    expect(field.at('foo').error).toBe(111);

    expect(notifySpy).toHaveBeenCalledTimes(1);
    expect(fooNotifySpy).toHaveBeenCalledTimes(1);
  });

  test('sets null as an error to the root field', () => {
    const field = createField(objectAccessor, { foo: 0 }, validationPlugin(validatorStub));

    field.setError(null);

    expect(field.invalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(false);
    expect(field.at('foo').error).toBe(null);
  });

  test('deletes an error from the root field', () => {
    const field = createField(objectAccessor, { foo: 0 }, validationPlugin(validatorStub));

    const notifySpy = jest.spyOn(field, 'notify');
    const fooNotifySpy = jest.spyOn(field.at('foo'), 'notify');

    field.setError(111);
    field.deleteError();

    expect(field.invalid).toBe(false);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(false);
    expect(field.at('foo').error).toBe(null);

    expect(notifySpy).toHaveBeenCalledTimes(2);
    expect(fooNotifySpy).not.toHaveBeenCalled();
  });

  test('deletes an error from the child field', () => {
    const field = createField(objectAccessor, { foo: 0 }, validationPlugin(validatorStub));

    const notifySpy = jest.spyOn(field, 'notify');
    const fooNotifySpy = jest.spyOn(field.at('foo'), 'notify');

    field.at('foo').setError(111);
    field.at('foo').deleteError();

    expect(field.invalid).toBe(false);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(false);
    expect(field.at('foo').error).toBe(null);

    expect(notifySpy).toHaveBeenCalledTimes(2);
    expect(fooNotifySpy).toHaveBeenCalledTimes(2);
  });

  test('deletes an error from the child field but parent remains invalid', () => {
    const field = createField(objectAccessor, { foo: 0, bar: 'qux' }, validationPlugin(validatorStub));

    const notifySpy = jest.spyOn(field, 'notify');
    const fooNotifySpy = jest.spyOn(field.at('foo'), 'notify');
    const barNotifySpy = jest.spyOn(field.at('bar'), 'notify');

    field.at('foo').setError(111);
    field.at('bar').setError(222);

    field.at('bar').deleteError();

    expect(field.invalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(true);
    expect(field.at('foo').error).toBe(111);

    expect(field.at('bar').invalid).toBe(false);
    expect(field.at('bar').error).toBe(null);

    expect(notifySpy).toHaveBeenCalledTimes(1);
    expect(fooNotifySpy).toHaveBeenCalledTimes(1);
    expect(barNotifySpy).toHaveBeenCalledTimes(2);
  });

  test('clears all errors', () => {
    const field = createField(objectAccessor, { foo: 0, bar: 'qux' }, validationPlugin(validatorStub));

    const notifySpy = jest.spyOn(field, 'notify');
    const fooNotifySpy = jest.spyOn(field.at('foo'), 'notify');
    const barNotifySpy = jest.spyOn(field.at('bar'), 'notify');

    field.at('foo').setError(111);
    field.at('bar').setError(222);

    field.clearErrors();

    expect(field.invalid).toBe(false);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(false);
    expect(field.at('foo').error).toBe(null);

    expect(field.at('bar').invalid).toBe(false);
    expect(field.at('bar').error).toBe(null);

    expect(notifySpy).toHaveBeenCalledTimes(2);
    expect(fooNotifySpy).toHaveBeenCalledTimes(2);
    expect(barNotifySpy).toHaveBeenCalledTimes(2);
  });

  test('synchronously validates the root field', () => {
    const field = createField(
      objectAccessor,
      { foo: 0 },
      validationPlugin({
        validate(field, setInternalError) {
          setInternalError(field.at('foo'), 111);
          return { ok: true, value: field.value };
        },

        validateAsync: validatorStub.validateAsync,
      })
    );

    const notifySpy = jest.spyOn(field, 'notify');
    const fooNotifySpy = jest.spyOn(field.at('foo'), 'notify');

    expect(field.validate()).toEqual({ ok: true, value: { foo: 0 } });

    expect(field.validating).toBe(false);
    expect(field.invalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').validating).toBe(false);
    expect(field.at('foo').invalid).toBe(true);
    expect(field.at('foo').error).toBe(111);

    expect(notifySpy).toHaveBeenCalledTimes(1);
    expect(fooNotifySpy).toHaveBeenCalledTimes(1);
  });

  test('synchronously validates the child field', () => {
    const field = createField(
      objectAccessor,
      { foo: 0 },
      validationPlugin({
        validate(field, setInternalError) {
          setInternalError(field, 111);
          return { ok: true, value: field.value };
        },

        validateAsync: validatorStub.validateAsync,
      })
    );

    const notifySpy = jest.spyOn(field, 'notify');
    const fooNotifySpy = jest.spyOn(field.at('foo'), 'notify');

    field.at('foo').validate();

    expect(field.validating).toBe(false);
    expect(field.invalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').validating).toBe(false);
    expect(field.at('foo').invalid).toBe(true);
    expect(field.at('foo').error).toBe(111);

    expect(notifySpy).toHaveBeenCalledTimes(1);
    expect(fooNotifySpy).toHaveBeenCalledTimes(1);
  });

  test('synchronously validates multiple fields', () => {
    const field = createField(
      objectAccessor,
      { foo: 0, bar: 'qux' },
      validationPlugin({
        validate(field, setInternalError) {
          setInternalError(field.at('foo'), 111);
          setInternalError(field.at('bar'), 222);
          return { ok: true, value: field.value };
        },

        validateAsync: validatorStub.validateAsync,
      })
    );

    field.validate();

    expect(field.invalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(true);
    expect(field.at('foo').error).toBe(111);

    expect(field.at('bar').invalid).toBe(true);
    expect(field.at('bar').error).toBe(222);
  });

  test('clears previous validation errors before validation', () => {
    const validateMock = jest.fn();

    validateMock.mockImplementationOnce((field, setInternalError) => {
      setInternalError(field.at('foo'), 111);
      setInternalError(field.at('bar'), 222);
      return { ok: true, value: field.value };
    });

    validateMock.mockImplementationOnce((field, setInternalError) => {
      setInternalError(field.at('foo'), 111);
      return { ok: true, value: field.value };
    });

    const field = createField(
      objectAccessor,
      { foo: 0, bar: 'qux' },
      validationPlugin({
        validate: validateMock,
        validateAsync: validatorStub.validateAsync,
      })
    );

    field.validate();
    field.validate();

    expect(validateMock).toHaveBeenCalledTimes(2);

    expect(field.invalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(true);
    expect(field.at('foo').error).toBe(111);

    expect(field.at('bar').invalid).toBe(false);
    expect(field.at('bar').error).toBe(null);
  });

  test('does not clear an error set by the user before validation', () => {
    const field = createField(
      objectAccessor,
      { foo: 0, bar: 'qux' },
      validationPlugin({
        validate(field, setInternalError) {
          setInternalError(field.at('foo'), 111);
          return { ok: true, value: field.value };
        },

        validateAsync: validatorStub.validateAsync,
      })
    );

    field.at('bar').setError(222);

    field.validate();

    expect(field.invalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(true);
    expect(field.at('foo').error).toEqual(111);

    expect(field.at('bar').invalid).toBe(true);
    expect(field.at('bar').error).toBe(222);
  });

  test('does not raise validation errors for transient fields', () => {
    const field = createField(
      objectAccessor,
      { foo: 0, bar: 'qux' },
      validationPlugin({
        validate(field, setInternalError) {
          setInternalError(field.at('foo'), 111);
          setInternalError(field.at('bar'), 222);
          return { ok: true, value: field.value };
        },

        validateAsync: validatorStub.validateAsync,
      })
    );

    field.at('bar').setTransientValue('');

    field.validate();

    expect(field.invalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(true);
    expect(field.at('foo').error).toBe(111);

    expect(field.at('bar').invalid).toBe(false);
    expect(field.at('bar').error).toBe(null);
  });

  test('asynchronously validates the root field', async () => {
    const field = createField(
      objectAccessor,
      { foo: 0 },
      validationPlugin({
        validate: validatorStub.validate,

        async validateAsync(field, setInternalError) {
          setInternalError(field.at('foo'), 111);
          return { ok: true, value: field.value };
        },
      })
    );

    const notifySpy = jest.spyOn(field, 'notify');
    const fooNotifySpy = jest.spyOn(field.at('foo'), 'notify');

    const promise = field.validateAsync();

    expect(promise).toBeInstanceOf(Promise);

    expect(field.validating).toBe(true);
    expect(field.at('foo').validating).toBe(true);

    await expect(promise).resolves.toEqual({ ok: true, value: { foo: 0 } });

    expect(field.validating).toBe(false);
    expect(field.invalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').validating).toBe(false);
    expect(field.at('foo').invalid).toBe(true);
    expect(field.at('foo').error).toBe(111);

    expect(notifySpy).toHaveBeenCalledTimes(3);
    expect(fooNotifySpy).toHaveBeenCalledTimes(3);
  });

  test('asynchronously validates the child field', async () => {
    const field = createField(
      objectAccessor,
      { foo: 0 },
      validationPlugin({
        validate: validatorStub.validate,

        async validateAsync(field, setInternalError) {
          setInternalError(field, 111);
          return { ok: true, value: field.value };
        },
      })
    );

    const notifySpy = jest.spyOn(field, 'notify');
    const fooNotifySpy = jest.spyOn(field.at('foo'), 'notify');

    const promise = field.at('foo').validateAsync();

    expect(field.validating).toBe(false);
    expect(field.at('foo').validating).toBe(true);

    await expect(promise).resolves.toEqual({ ok: true, value: 0 });

    expect(field.validating).toBe(false);
    expect(field.invalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').validating).toBe(false);
    expect(field.at('foo').invalid).toBe(true);
    expect(field.at('foo').error).toBe(111);

    expect(notifySpy).toHaveBeenCalledTimes(1);
    expect(fooNotifySpy).toHaveBeenCalledTimes(3);
  });

  test('cleans up validation if a sync error is thrown', () => {
    const field = createField(
      objectAccessor,
      { foo: 0, bar: 'qux' },
      validationPlugin({
        validate() {
          throw new Error('expected');
        },
        validateAsync: validatorStub.validateAsync,
      })
    );

    field.at('foo');

    expect(() => field.validate()).toThrow(new Error('expected'));

    expect(field.validating).toBe(false);
    expect(field.invalid).toBe(false);
    expect(field.error).toBe(null);

    expect(field.at('foo').validating).toBe(false);
    expect(field.at('foo').invalid).toBe(false);
    expect(field.at('foo').error).toBe(null);
  });

  test('cleans up validation if an async error is thrown', async () => {
    const field = createField(
      objectAccessor,
      { foo: 0, bar: 'qux' },
      validationPlugin({
        validate: validatorStub.validate,

        async validateAsync() {
          throw new Error('expected');
        },
      })
    );

    field.at('foo');

    const promise = field.validateAsync();

    await expect(promise).rejects.toEqual(new Error('expected'));

    expect(field.validating).toBe(false);
    expect(field.invalid).toBe(false);
    expect(field.error).toBe(null);

    expect(field.at('foo').validating).toBe(false);
    expect(field.at('foo').invalid).toBe(false);
    expect(field.at('foo').error).toBe(null);
  });

  test('aborts validation', async () => {
    let lastSignal: AbortSignal | undefined;

    const field = createField(
      objectAccessor,
      { foo: 0, bar: 'qux' },
      validationPlugin({
        validate: validatorStub.validate,

        async validateAsync(field, setInternalError, context, signal) {
          lastSignal = signal;
          return { ok: true, value: field.value };
        },
      })
    );

    const promise = field.validateAsync();

    expect(field.validating).toBe(true);
    expect(field.at('foo').validating).toBe(true);

    field.abortValidation();

    expect(lastSignal!.aborted).toBe(true);
    expect(field.validating).toBe(false);
    expect(field.at('foo').validating).toBe(false);

    await expect(promise).rejects.toEqual(new Error('Aborted'));
  });

  test('validation aborts pending validation when invoked on the same field', async () => {
    const signals: AbortSignal[] = [];

    const field = createField(
      objectAccessor,
      { foo: 0, bar: 'qux' },
      validationPlugin({
        validate: validatorStub.validate,

        async validateAsync(field, setInternalError, context, signal) {
          signals.push(signal);
          return { ok: true, value: field.value };
        },
      })
    );

    const promise = field.validateAsync();

    field.validateAsync();

    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);

    await expect(promise).rejects.toEqual(new Error('Aborted'));
  });

  test('derived field validation does not abort the parent validation', () => {
    const signals: AbortSignal[] = [];

    const field = createField(
      objectAccessor,
      { foo: 0, bar: 'qux' },
      validationPlugin({
        validate: validatorStub.validate,

        async validateAsync(field, setInternalError, context, signal) {
          signals.push(signal);
          return { ok: true, value: field.value };
        },
      })
    );

    field.validateAsync();
    field.at('foo').validateAsync();

    expect(signals[0].aborted).toBe(false);
    expect(signals[1].aborted).toBe(false);
  });

  test('does not apply errors from the aborted validation', async () => {
    const validateAsyncMock = jest.fn();

    validateAsyncMock.mockImplementationOnce((field, setInternalError) => {
      return Promise.resolve().then(() => setInternalError(field.at('foo'), 111));
    });

    validateAsyncMock.mockImplementationOnce((field, setInternalError) => {
      return Promise.resolve().then(() => setInternalError(field.at('bar'), 222));
    });

    const field = createField(
      objectAccessor,
      { foo: 0, bar: 'qux' },
      validationPlugin({
        validate: validatorStub.validate,
        validateAsync: validateAsyncMock,
      })
    );

    const promise = field.validateAsync();

    await field.validateAsync();

    expect(field.at('foo').error).toBe(null);
    expect(field.at('bar').error).toBe(222);

    await expect(promise).rejects.toEqual(new Error('Aborted'));
  });
});
