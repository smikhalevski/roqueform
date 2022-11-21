import { createField, objectAccessor, validationPlugin } from '../main';

describe('validationPlugin', () => {
  test('enhances the field', () => {
    const field = createField(
      objectAccessor,
      { foo: 0 },
      validationPlugin(() => undefined)
    );

    expect(field.validating).toBe(false);
    expect(field.invalid).toBe(false);
    expect(field.error).toBe(null);

    expect(field.at('foo').validating).toBe(false);
    expect(field.at('foo').invalid).toBe(false);
    expect(field.at('foo').error).toBe(null);
  });

  test('sets an error to the root field', () => {
    const field = createField(
      objectAccessor,
      { foo: 0 },
      validationPlugin(() => undefined)
    );

    const notifyMock = jest.spyOn(field, 'notify');
    const fooNotifyMock = jest.spyOn(field.at('foo'), 'notify');

    field.setError(111);

    expect(field.invalid).toBe(true);
    expect(field.error).toBe(111);

    expect(field.at('foo').invalid).toBe(false);
    expect(field.at('foo').error).toBe(null);

    expect(notifyMock).toHaveBeenCalledTimes(1);
    expect(fooNotifyMock).not.toHaveBeenCalled();
  });

  test('sets an error to the child field', () => {
    const field = createField(
      objectAccessor,
      { foo: 0 },
      validationPlugin(() => undefined)
    );

    const notifyMock = jest.spyOn(field, 'notify');
    const fooNotifyMock = jest.spyOn(field.at('foo'), 'notify');

    field.at('foo').setError(111);

    expect(field.invalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(true);
    expect(field.at('foo').error).toBe(111);

    expect(notifyMock).toHaveBeenCalledTimes(1);
    expect(fooNotifyMock).toHaveBeenCalledTimes(1);
  });

  test('sets null as an error to the root field', () => {
    const field = createField(
      objectAccessor,
      { foo: 0 },
      validationPlugin(() => undefined)
    );

    field.setError(null);

    expect(field.invalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(false);
    expect(field.at('foo').error).toBe(null);
  });

  test('deletes an error from the root field', () => {
    const field = createField(
      objectAccessor,
      { foo: 0 },
      validationPlugin(() => undefined)
    );

    const notifyMock = jest.spyOn(field, 'notify');
    const fooNotifyMock = jest.spyOn(field.at('foo'), 'notify');

    field.setError(111);
    field.deleteError();

    expect(field.invalid).toBe(false);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(false);
    expect(field.at('foo').error).toBe(null);

    expect(notifyMock).toHaveBeenCalledTimes(2);
    expect(fooNotifyMock).not.toHaveBeenCalled();
  });

  test('deletes an error from the child field', () => {
    const field = createField(
      objectAccessor,
      { foo: 0 },
      validationPlugin(() => undefined)
    );

    const notifyMock = jest.spyOn(field, 'notify');
    const fooNotifyMock = jest.spyOn(field.at('foo'), 'notify');

    field.at('foo').setError(111);
    field.at('foo').deleteError();

    expect(field.invalid).toBe(false);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(false);
    expect(field.at('foo').error).toBe(null);

    expect(notifyMock).toHaveBeenCalledTimes(2);
    expect(fooNotifyMock).toHaveBeenCalledTimes(2);
  });

  test('deletes an error from the child field but parent remains invalid', () => {
    const field = createField(
      objectAccessor,
      { foo: 0, bar: 'qux' },
      validationPlugin(() => undefined)
    );

    const notifyMock = jest.spyOn(field, 'notify');
    const fooNotifyMock = jest.spyOn(field.at('foo'), 'notify');
    const barNotifyMock = jest.spyOn(field.at('bar'), 'notify');

    field.at('foo').setError(111);
    field.at('bar').setError(222);

    field.at('bar').deleteError();

    expect(field.invalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(true);
    expect(field.at('foo').error).toBe(111);

    expect(field.at('bar').invalid).toBe(false);
    expect(field.at('bar').error).toBe(null);

    expect(notifyMock).toHaveBeenCalledTimes(1);
    expect(fooNotifyMock).toHaveBeenCalledTimes(1);
    expect(barNotifyMock).toHaveBeenCalledTimes(2);
  });

  test('clears all errors', () => {
    const field = createField(
      objectAccessor,
      { foo: 0, bar: 'qux' },
      validationPlugin(() => undefined)
    );

    const notifyMock = jest.spyOn(field, 'notify');
    const fooNotifyMock = jest.spyOn(field.at('foo'), 'notify');
    const barNotifyMock = jest.spyOn(field.at('bar'), 'notify');

    field.at('foo').setError(111);
    field.at('bar').setError(222);

    field.clearErrors();

    expect(field.invalid).toBe(false);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(false);
    expect(field.at('foo').error).toBe(null);

    expect(field.at('bar').invalid).toBe(false);
    expect(field.at('bar').error).toBe(null);

    expect(notifyMock).toHaveBeenCalledTimes(2);
    expect(fooNotifyMock).toHaveBeenCalledTimes(2);
    expect(barNotifyMock).toHaveBeenCalledTimes(2);
  });

  test('syncly validates the root field', () => {
    const field = createField(
      objectAccessor,
      { foo: 0 },
      validationPlugin((field, applyError) => {
        applyError(field.at('foo'), 111);
      })
    );

    const notifyMock = jest.spyOn(field, 'notify');
    const fooNotifyMock = jest.spyOn(field.at('foo'), 'notify');

    expect(field.validate()).toBe(undefined);

    expect(field.validating).toBe(false);
    expect(field.invalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').validating).toBe(false);
    expect(field.at('foo').invalid).toBe(true);
    expect(field.at('foo').error).toBe(111);

    expect(notifyMock).toHaveBeenCalledTimes(1);
    expect(fooNotifyMock).toHaveBeenCalledTimes(1);
  });

  test('syncly validates the child field', () => {
    const field = createField(
      objectAccessor,
      { foo: 0 },
      validationPlugin((field, applyError) => {
        applyError(field, 111);
      })
    );

    const notifyMock = jest.spyOn(field, 'notify');
    const fooNotifyMock = jest.spyOn(field.at('foo'), 'notify');

    field.at('foo').validate();

    expect(field.validating).toBe(false);
    expect(field.invalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').validating).toBe(false);
    expect(field.at('foo').invalid).toBe(true);
    expect(field.at('foo').error).toBe(111);

    expect(notifyMock).toHaveBeenCalledTimes(1);
    expect(fooNotifyMock).toHaveBeenCalledTimes(1);
  });

  test('syncly validates multiple fields', () => {
    const field = createField(
      objectAccessor,
      { foo: 0, bar: 'qux' },
      validationPlugin((field, applyError) => {
        applyError(field.at('foo'), 111);
        applyError(field.at('bar'), 222);
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
    const validateCallbackMock = jest.fn();

    validateCallbackMock.mockImplementationOnce((field, applyError) => {
      applyError(field.at('foo'), 111);
      applyError(field.at('bar'), 222);
    });

    validateCallbackMock.mockImplementationOnce((field, applyError) => {
      applyError(field.at('foo'), 111);
    });

    const field = createField(objectAccessor, { foo: 0, bar: 'qux' }, validationPlugin(validateCallbackMock));

    field.validate();
    field.validate();

    expect(validateCallbackMock).toHaveBeenCalledTimes(2);

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
      validationPlugin((field, applyError) => {
        applyError(field.at('foo'), 111);
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
      validationPlugin((field, applyError) => {
        applyError(field.at('foo'), 111);
        applyError(field.at('bar'), 222);
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

  test('asyncly validates the root field', async () => {
    const field = createField(
      objectAccessor,
      { foo: 0 },
      validationPlugin(async (field, applyError) => {
        applyError(field.at('foo'), 111);
      })
    );

    const notifyMock = jest.spyOn(field, 'notify');
    const fooNotifyMock = jest.spyOn(field.at('foo'), 'notify');

    const promise = field.validate();

    expect(promise).toBeInstanceOf(Promise);

    expect(field.validating).toBe(true);
    expect(field.at('foo').validating).toBe(true);

    await promise;

    expect(field.validating).toBe(false);
    expect(field.invalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').validating).toBe(false);
    expect(field.at('foo').invalid).toBe(true);
    expect(field.at('foo').error).toBe(111);

    expect(notifyMock).toHaveBeenCalledTimes(2);
    expect(fooNotifyMock).toHaveBeenCalledTimes(2);
  });

  test('asyncly validates the child field', async () => {
    const field = createField(
      objectAccessor,
      { foo: 0 },
      validationPlugin(async (field, applyError) => {
        applyError(field, 111);
      })
    );

    const notifyMock = jest.spyOn(field, 'notify');
    const fooNotifyMock = jest.spyOn(field.at('foo'), 'notify');

    const promise = field.at('foo').validate();

    expect(field.validating).toBe(false);
    expect(field.at('foo').validating).toBe(true);

    await promise;

    expect(field.validating).toBe(false);
    expect(field.invalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').validating).toBe(false);
    expect(field.at('foo').invalid).toBe(true);
    expect(field.at('foo').error).toBe(111);

    expect(notifyMock).toHaveBeenCalledTimes(1);
    expect(fooNotifyMock).toHaveBeenCalledTimes(2);
  });

  test('cleans up validation if a sync error is thrown', () => {
    const field = createField(
      objectAccessor,
      { foo: 0, bar: 'qux' },
      validationPlugin(() => {
        throw 111;
      })
    );

    field.at('foo');

    expect(() => field.validate()).toThrow();

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
      validationPlugin(async () => {
        throw 111;
      })
    );

    field.at('foo');

    const promise = field.validate();

    await expect(promise).rejects.toBe(111);

    expect(field.validating).toBe(false);
    expect(field.invalid).toBe(false);
    expect(field.error).toBe(null);

    expect(field.at('foo').validating).toBe(false);
    expect(field.at('foo').invalid).toBe(false);
    expect(field.at('foo').error).toBe(null);
  });

  test('aborts validation', () => {
    let lastSignal: AbortSignal | undefined;

    const field = createField(
      objectAccessor,
      { foo: 0, bar: 'qux' },
      validationPlugin(async (field, applyError, signal) => {
        lastSignal = signal;
      })
    );

    field.validate();

    expect(field.validating).toBe(true);
    expect(field.at('foo').validating).toBe(true);

    field.abortValidation();

    expect(lastSignal?.aborted).toBe(true);
    expect(field.validating).toBe(false);
    expect(field.at('foo').validating).toBe(false);
  });

  test('validation aborts pending validation when invoked on the same field', () => {
    const signals: AbortSignal[] = [];

    const field = createField(
      objectAccessor,
      { foo: 0, bar: 'qux' },
      validationPlugin(async (field, applyError, signal) => {
        signals.push(signal);
      })
    );

    field.validate();
    field.validate();

    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
  });

  test('validation aborts pending validation when invoked on the derived field', () => {
    const signals: AbortSignal[] = [];

    const field = createField(
      objectAccessor,
      { foo: 0, bar: 'qux' },
      validationPlugin(async (field, applyError, signal) => {
        signals.push(signal);
      })
    );

    field.validate();
    field.at('foo').validate();

    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
  });

  test('does not apply errors from the aborted validation', async () => {
    const validateCallbackMock = jest.fn();

    validateCallbackMock.mockImplementationOnce((field, applyError) => {
      return Promise.resolve().then(() => applyError(field.at('foo'), 111));
    });

    validateCallbackMock.mockImplementationOnce((field, applyError) => {
      return Promise.resolve().then(() => applyError(field.at('bar'), 222));
    });

    const field = createField(objectAccessor, { foo: 0, bar: 'qux' }, validationPlugin(validateCallbackMock));

    field.validate();

    await field.validate();

    expect(field.at('foo').error).toBe(null);
    expect(field.at('bar').error).toBe(222);
  });
});
