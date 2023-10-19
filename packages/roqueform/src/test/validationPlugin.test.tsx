import { createField, validationPlugin, Validator } from '../main';

describe('validationPlugin', () => {
  const noopValidator: Validator<unknown, unknown> = {
    validate: () => undefined,
  };

  test('enhances the field', () => {
    const field = createField({ foo: 0 }, validationPlugin(noopValidator));

    expect(field.isValidating).toBe(false);
    expect(field.isInvalid).toBe(false);
    expect(field.error).toBe(null);

    expect(field.at('foo').isValidating).toBe(false);
    expect(field.at('foo').isInvalid).toBe(false);
    expect(field.at('foo').error).toBe(null);
  });

  test('sets an error to the root field', () => {
    const field = createField({ foo: 0 }, validationPlugin(noopValidator));

    const listenerMock = jest.fn();
    const fooListenerMock = jest.fn();

    field.subscribe(listenerMock);
    field.at('foo').subscribe(fooListenerMock);

    field.setError(111);

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBe(111);

    expect(field.at('foo').isInvalid).toBe(false);
    expect(field.at('foo').error).toBe(null);

    expect(listenerMock).toHaveBeenCalledTimes(1);
    expect(fooListenerMock).not.toHaveBeenCalled();
  });

  test('sets an error to the child field', () => {
    const field = createField({ foo: 0 }, validationPlugin(noopValidator));

    const listenerMock = jest.fn();
    const fooListenerMock = jest.fn();

    field.subscribe(listenerMock);
    field.at('foo').subscribe(fooListenerMock);

    field.at('foo').setError(111);

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').isInvalid).toBe(true);
    expect(field.at('foo').error).toBe(111);

    expect(listenerMock).toHaveBeenCalledTimes(1);
    expect(fooListenerMock).toHaveBeenCalledTimes(1);
  });

  test('sets null as an error to the root field', () => {
    const field = createField({ foo: 0 }, validationPlugin(noopValidator));

    field.setError(null);

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').isInvalid).toBe(false);
    expect(field.at('foo').error).toBe(null);
  });

  test('deletes an error from the root field', () => {
    const field = createField({ foo: 0 }, validationPlugin(noopValidator));

    const listenerMock = jest.fn();
    const fooListenerMock = jest.fn();

    field.subscribe(listenerMock);
    field.at('foo').subscribe(fooListenerMock);

    field.setError(111);
    field.deleteError();

    expect(field.isInvalid).toBe(false);
    expect(field.error).toBe(null);

    expect(field.at('foo').isInvalid).toBe(false);
    expect(field.at('foo').error).toBe(null);

    expect(listenerMock).toHaveBeenCalledTimes(2);
    expect(fooListenerMock).not.toHaveBeenCalled();
  });

  test('deletes an error from the child field', () => {
    const field = createField({ foo: 0 }, validationPlugin(noopValidator));

    const listenerMock = jest.fn();
    const fooListenerMock = jest.fn();

    field.subscribe(listenerMock);
    field.at('foo').subscribe(fooListenerMock);

    field.at('foo').setError(111);
    field.at('foo').deleteError();

    expect(field.isInvalid).toBe(false);
    expect(field.error).toBe(null);

    expect(field.at('foo').isInvalid).toBe(false);
    expect(field.at('foo').error).toBe(null);

    expect(listenerMock).toHaveBeenCalledTimes(2);
    expect(fooListenerMock).toHaveBeenCalledTimes(2);
  });

  test('deletes an error from the child field but parent remains invalid', () => {
    const field = createField({ foo: 0, bar: 'qux' }, validationPlugin(noopValidator));

    const listenerMock = jest.fn();
    const fooListenerMock = jest.fn();
    const barListenerMock = jest.fn();

    field.subscribe(listenerMock);
    field.at('foo').subscribe(fooListenerMock);
    field.at('bar').subscribe(barListenerMock);

    field.at('foo').setError(111);
    field.at('bar').setError(222);

    field.at('bar').deleteError();

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').isInvalid).toBe(true);
    expect(field.at('foo').error).toBe(111);

    expect(field.at('bar').isInvalid).toBe(false);
    expect(field.at('bar').error).toBe(null);

    expect(listenerMock).toHaveBeenCalledTimes(1);
    expect(fooListenerMock).toHaveBeenCalledTimes(1);
    expect(barListenerMock).toHaveBeenCalledTimes(2);
  });

  test('clears all errors', () => {
    const field = createField({ foo: 0, bar: 'qux' }, validationPlugin(noopValidator));

    const listenerMock = jest.fn();
    const fooListenerMock = jest.fn();
    const barListenerMock = jest.fn();

    field.subscribe(listenerMock);
    field.at('foo').subscribe(fooListenerMock);
    field.at('bar').subscribe(barListenerMock);

    field.at('foo').setError(111);
    field.at('bar').setError(222);

    field.clearErrors();

    expect(field.isInvalid).toBe(false);
    expect(field.error).toBe(null);

    expect(field.at('foo').isInvalid).toBe(false);
    expect(field.at('foo').error).toBe(null);

    expect(field.at('bar').isInvalid).toBe(false);
    expect(field.at('bar').error).toBe(null);

    expect(listenerMock).toHaveBeenCalledTimes(2);
    expect(fooListenerMock).toHaveBeenCalledTimes(2);
    expect(barListenerMock).toHaveBeenCalledTimes(2);
  });

  test('clears errors from nested fields', () => {
    const field = createField(
      {
        foo: {
          bar: {
            baz: 'aaa',
            qux: 'bbb',
          },
        },
      },
      validationPlugin(noopValidator)
    );

    field.at('foo').at('bar').at('baz').setError(111);
    field.at('foo').at('bar').at('qux').setError(111);

    field.clearErrors();

    expect(field.isInvalid).toBe(false);
    expect(field.error).toBe(null);

    expect(field.at('foo').isInvalid).toBe(false);
    expect(field.at('foo').at('bar').isInvalid).toBe(false);
    expect(field.at('foo').at('bar').at('baz').isInvalid).toBe(false);
    expect(field.at('foo').at('bar').at('qux').isInvalid).toBe(false);
  });

  test('synchronously validates the root field', () => {
    const field = createField(
      { foo: 0 },
      validationPlugin({
        validate(field, setError) {
          setError(field.at('foo'), 111);
        },
      })
    );

    const listenerMock = jest.fn();
    const fooListenerMock = jest.fn();

    field.subscribe(listenerMock);
    field.at('foo').subscribe(fooListenerMock);

    expect(field.validate()).toEqual([111]);

    expect(field.isValidating).toBe(false);
    expect(field.isInvalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').isValidating).toBe(false);
    expect(field.at('foo').isInvalid).toBe(true);
    expect(field.at('foo').error).toBe(111);

    expect(listenerMock).toHaveBeenCalledTimes(1);
    expect(fooListenerMock).toHaveBeenCalledTimes(1);
  });

  test('synchronously validates the root field with a callback validator', () => {
    const field = createField(
      { foo: 0 },
      validationPlugin((field, setError) => {
        setError(field.at('foo'), 111);
      })
    );

    const listenerMock = jest.fn();
    const fooListenerMock = jest.fn();

    field.subscribe(listenerMock);
    field.at('foo').subscribe(fooListenerMock);

    expect(field.validate()).toEqual([111]);

    expect(field.isValidating).toBe(false);
    expect(field.isInvalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').isValidating).toBe(false);
    expect(field.at('foo').isInvalid).toBe(true);
    expect(field.at('foo').error).toBe(111);

    expect(listenerMock).toHaveBeenCalledTimes(1);
    expect(fooListenerMock).toHaveBeenCalledTimes(1);
  });

  test('synchronously validates the child field', () => {
    const field = createField(
      { foo: 0 },
      validationPlugin({
        validate(field, setError) {
          setError(field, 111);
        },
      })
    );

    const listenerMock = jest.fn();
    const fooListenerMock = jest.fn();

    field.subscribe(listenerMock);
    field.at('foo').subscribe(fooListenerMock);

    field.at('foo').validate();

    expect(field.isValidating).toBe(false);
    expect(field.isInvalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').isValidating).toBe(false);
    expect(field.at('foo').isInvalid).toBe(true);
    expect(field.at('foo').error).toBe(111);

    expect(listenerMock).toHaveBeenCalledTimes(1);
    expect(fooListenerMock).toHaveBeenCalledTimes(1);
  });

  test('synchronously validates multiple fields', () => {
    const field = createField(
      { foo: 0, bar: 'qux' },
      validationPlugin({
        validate(field, setError) {
          setError(field.at('foo'), 111);
          setError(field.at('bar'), 222);
        },
      })
    );

    field.validate();

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').isInvalid).toBe(true);
    expect(field.at('foo').error).toBe(111);

    expect(field.at('bar').isInvalid).toBe(true);
    expect(field.at('bar').error).toBe(222);
  });

  test('clears previous validation errors before validation', () => {
    const validateMock = jest.fn();

    validateMock.mockImplementationOnce((field, setError) => {
      setError(field.at('foo'), 111);
      setError(field.at('bar'), 222);
    });

    validateMock.mockImplementationOnce((field, setError) => {
      setError(field.at('foo'), 111);
    });

    const field = createField(
      { foo: 0, bar: 'qux' },
      validationPlugin({
        validate: validateMock,
      })
    );

    field.validate();
    field.validate();

    expect(validateMock).toHaveBeenCalledTimes(2);

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').isInvalid).toBe(true);
    expect(field.at('foo').error).toBe(111);

    expect(field.at('bar').isInvalid).toBe(false);
    expect(field.at('bar').error).toBe(null);
  });

  test('does not clear an error set by the user before validation', () => {
    const field = createField(
      { foo: 0, bar: 'qux' },
      validationPlugin({
        validate(field, setError) {
          setError(field.at('foo'), 111);
        },
      })
    );

    field.at('bar').setError(222);

    field.validate();

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').isInvalid).toBe(true);
    expect(field.at('foo').error).toEqual(111);

    expect(field.at('bar').isInvalid).toBe(true);
    expect(field.at('bar').error).toBe(222);
  });

  test('does not raise validation errors for transient fields', () => {
    const field = createField(
      { foo: 0, bar: 'qux' },
      validationPlugin({
        validate(field, setError) {
          setError(field.at('foo'), 111);
          setError(field.at('bar'), 222);
        },
      })
    );

    field.at('bar').setTransientValue('');

    field.validate();

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').isInvalid).toBe(true);
    expect(field.at('foo').error).toBe(111);

    expect(field.at('bar').isInvalid).toBe(false);
    expect(field.at('bar').error).toBe(null);
  });

  test('asynchronously validates the root field', async () => {
    const field = createField(
      { foo: 0 },
      validationPlugin({
        validate: () => undefined,

        async validateAsync(field, setError) {
          setError(field.at('foo'), 111);
        },
      })
    );

    const listenerMock = jest.fn();
    const fooListenerMock = jest.fn();

    field.subscribe(listenerMock);
    field.at('foo').subscribe(fooListenerMock);

    const promise = field.validateAsync();

    expect(promise).toBeInstanceOf(Promise);

    expect(field.isValidating).toBe(true);
    expect(field.at('foo').isValidating).toBe(true);

    await expect(promise).resolves.toEqual([111]);

    expect(field.isValidating).toBe(false);
    expect(field.isInvalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').isValidating).toBe(false);
    expect(field.at('foo').isInvalid).toBe(true);
    expect(field.at('foo').error).toBe(111);

    expect(listenerMock).toHaveBeenCalledTimes(3);
    expect(fooListenerMock).toHaveBeenCalledTimes(3);
  });

  test('asynchronously validates the child field', async () => {
    const field = createField(
      { foo: 0 },
      validationPlugin({
        validate: () => undefined,

        async validateAsync(field, setError) {
          setError(field, 111);
        },
      })
    );

    const listenerMock = jest.fn();
    const fooListenerMock = jest.fn();

    field.subscribe(listenerMock);
    field.at('foo').subscribe(fooListenerMock);

    const promise = field.at('foo').validateAsync();

    expect(field.isValidating).toBe(false);
    expect(field.at('foo').isValidating).toBe(true);

    await expect(promise).resolves.toEqual([111]);

    expect(field.isValidating).toBe(false);
    expect(field.isInvalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').isValidating).toBe(false);
    expect(field.at('foo').isInvalid).toBe(true);
    expect(field.at('foo').error).toBe(111);

    expect(listenerMock).toHaveBeenCalledTimes(1);
    expect(fooListenerMock).toHaveBeenCalledTimes(3);
  });

  test('cleans up validation if a sync error is thrown', () => {
    const field = createField(
      { foo: 0, bar: 'qux' },
      validationPlugin({
        validate() {
          throw new Error('expected');
        },
      })
    );

    field.at('foo');

    expect(() => field.validate()).toThrow(new Error('expected'));

    expect(field.isValidating).toBe(false);
    expect(field.isInvalid).toBe(false);
    expect(field.error).toBe(null);

    expect(field.at('foo').isValidating).toBe(false);
    expect(field.at('foo').isInvalid).toBe(false);
    expect(field.at('foo').error).toBe(null);
  });

  test('cleans up validation if an async error is thrown', async () => {
    const field = createField(
      { foo: 0, bar: 'qux' },
      validationPlugin({
        validate: () => undefined,

        async validateAsync() {
          throw new Error('expected');
        },
      })
    );

    field.at('foo');

    const promise = field.validateAsync();

    await expect(promise).rejects.toEqual(new Error('expected'));

    expect(field.isValidating).toBe(false);
    expect(field.isInvalid).toBe(false);
    expect(field.error).toBe(null);

    expect(field.at('foo').isValidating).toBe(false);
    expect(field.at('foo').isInvalid).toBe(false);
    expect(field.at('foo').error).toBe(null);
  });

  test('aborts validation', async () => {
    let lastSignal: AbortSignal | undefined;

    const field = createField(
      { foo: 0, bar: 'qux' },
      validationPlugin({
        validate: () => undefined,

        async validateAsync(_field, _setError, _context, signal) {
          lastSignal = signal;
        },
      })
    );

    const promise = field.validateAsync();

    expect(field.isValidating).toBe(true);
    expect(field.at('foo').isValidating).toBe(true);

    field.abortValidation();

    expect(lastSignal!.aborted).toBe(true);
    expect(field.isValidating).toBe(false);
    expect(field.at('foo').isValidating).toBe(false);

    await expect(promise).rejects.toEqual(new Error('Validation aborted'));
  });

  test('validation aborts pending validation when invoked on the same field', async () => {
    const signals: AbortSignal[] = [];

    const field = createField(
      { foo: 0, bar: 'qux' },
      validationPlugin({
        validate: () => undefined,

        async validateAsync(_field, _setError, _context, signal) {
          signals.push(signal);
        },
      })
    );

    const promise = field.validateAsync();

    field.validateAsync();

    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);

    await expect(promise).rejects.toEqual(new Error('Validation aborted'));
  });

  test('derived field validation does not abort the parent validation', () => {
    const signals: AbortSignal[] = [];

    const field = createField(
      { foo: 0, bar: 'qux' },
      validationPlugin({
        validate: () => undefined,

        async validateAsync(_field, _setError, _context, signal) {
          signals.push(signal);
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

    validateAsyncMock.mockImplementationOnce((field, setError) => {
      return Promise.resolve().then(() => setError(field.at('foo'), 111));
    });

    validateAsyncMock.mockImplementationOnce((field, setError) => {
      return Promise.resolve().then(() => setError(field.at('bar'), 222));
    });

    const field = createField(
      { foo: 0, bar: 'qux' },
      validationPlugin({
        validate: () => undefined,
        validateAsync: validateAsyncMock,
      })
    );

    const promise = field.validateAsync();

    await field.validateAsync();

    expect(field.at('foo').error).toBe(null);
    expect(field.at('bar').error).toBe(222);

    await expect(promise).rejects.toEqual(new Error('Validation aborted'));
  });

  test('validation can be called in subscribe', () => {
    const field = createField({ foo: 0 }, validationPlugin(noopValidator));

    const listenerMock = jest.fn(() => {
      field.validate();
    });

    field.subscribe(listenerMock);

    field.at('foo').setValue(111);

    // field.at('foo').subscribe(fooListenerMock);
    //
    // field.setError(111);
    //
    // expect(field.isInvalid).toBe(true);
    // expect(field.error).toBe(111);
    //
    // expect(field.at('foo').isInvalid).toBe(false);
    // expect(field.at('foo').error).toBe(null);
    //
    // expect(listenerMock).toHaveBeenCalledTimes(1);
    // expect(fooListenerMock).not.toHaveBeenCalled();
    //
  });
});
