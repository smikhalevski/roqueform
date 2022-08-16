import { createField, objectAccessor, validationPlugin } from '../main';

describe('validationPlugin', () => {
  test('enhances the field', () => {
    const field = createField(
      objectAccessor,
      { foo: 0 },
      validationPlugin(() => undefined)
    );

    expect(field.invalid).toBe(false);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(false);
    expect(field.at('foo').error).toBe(null);
  });

  test('sets an error to the root field', () => {
    const field = createField(
      objectAccessor,
      { foo: 0 },
      validationPlugin(() => undefined)
    );

    field.setError(111);

    expect(field.invalid).toBe(true);
    expect(field.error).toBe(111);

    expect(field.at('foo').invalid).toBe(false);
    expect(field.at('foo').error).toBe(null);
  });

  test('sets an error to the child field', () => {
    const field = createField(
      objectAccessor,
      { foo: 0 },
      validationPlugin(() => undefined)
    );

    field.at('foo').setError(111);

    expect(field.invalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(true);
    expect(field.at('foo').error).toBe(111);
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

    field.setError(111);
    field.deleteError();

    expect(field.invalid).toBe(false);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(false);
    expect(field.at('foo').error).toBe(null);
  });

  test('deletes an error from the child field', () => {
    const field = createField(
      objectAccessor,
      { foo: 0 },
      validationPlugin(() => undefined)
    );

    field.at('foo').setError(111);
    field.at('foo').deleteError();

    expect(field.invalid).toBe(false);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(false);
    expect(field.at('foo').error).toBe(null);
  });

  test('deletes an error from the child field but parent remains invalid', () => {
    const field = createField(
      objectAccessor,
      { foo: 0, bar: 'qux' },
      validationPlugin(() => undefined)
    );

    field.at('foo').setError(111);
    field.at('bar').setError(222);

    field.at('bar').deleteError();

    expect(field.invalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(true);
    expect(field.at('foo').error).toBe(111);

    expect(field.at('bar').invalid).toBe(false);
    expect(field.at('bar').error).toBe(null);
  });

  test('clears all errors', () => {
    const field = createField(
      objectAccessor,
      { foo: 0, bar: 'qux' },
      validationPlugin(() => undefined)
    );

    field.at('foo').setError(111);
    field.at('bar').setError(222);

    field.clearErrors();

    expect(field.invalid).toBe(false);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(false);
    expect(field.at('foo').error).toBe(null);

    expect(field.at('bar').invalid).toBe(false);
    expect(field.at('bar').error).toBe(null);
  });

  // test('validates the root field', () => {
  //   const field = createField(
  //     objectAccessor,
  //     { foo: 0 },
  //     validationPlugin((field, applyError) => {
  //       applyError(field.at('foo'), 111);
  //     })
  //   );
  //
  //   field.validate();
  //
  //   expect(field.invalid).toBe(true);
  //   expect(field.error).toBe(null);
  //
  //   expect(field.at('foo').invalid).toBe(true);
  //   expect(field.at('foo').error).toBe(111);
  // });
  //
  // test('validates the child field', () => {
  //   const field = createField(
  //     objectAccessor,
  //     { foo: 0 },
  //     validationPlugin((field, applyError) => {
  //       applyError(field, 111);
  //     })
  //   );
  //
  //   field.at('foo').validate();
  //
  //   expect(field.invalid).toBe(true);
  //   expect(field.error).toBe(null);
  //
  //   expect(field.at('foo').invalid).toBe(true);
  //   expect(field.at('foo').error).toBe(111);
  // });
  //
  // test('validates multiple fields', () => {
  //   const field = createField(
  //     objectAccessor,
  //     { foo: 0, bar: 'qux' },
  //     validationPlugin((field, applyError) => {
  //       applyError(field.at('foo'), 111);
  //       applyError(field.at('bar'), 222);
  //     })
  //   );
  //
  //   field.validate();
  //
  //   expect(field.invalid).toBe(true);
  //   expect(field.error).toBe(null);
  //
  //   expect(field.at('foo').invalid).toBe(true);
  //   expect(field.at('foo').error).toBe(111);
  //
  //   expect(field.at('bar').invalid).toBe(true);
  //   expect(field.at('bar').error).toBe(222);
  // });
  //
  // test('validate clears previous validation errors', () => {
  //   const validateCallbackMock = jest.fn();
  //
  //   validateCallbackMock.mockImplementationOnce((field, applyError) => {
  //     applyError(field.at('foo'), 111);
  //     applyError(field.at('bar'), 222);
  //   });
  //
  //   validateCallbackMock.mockImplementationOnce((field, applyError) => {
  //     applyError(field.at('foo'), 111);
  //   });
  //
  //   const field = createField(objectAccessor, { foo: 0, bar: 'qux' }, validationPlugin(validateCallbackMock));
  //
  //   field.validate();
  //
  //   field.at('bar').dispatchValue('');
  //
  //   field.validate();
  //
  //   expect(validateCallbackMock).toHaveBeenCalledTimes(2);
  //
  //   expect(field.invalid).toBe(true);
  //   expect(field.error).toBe(null);
  //
  //   expect(field.at('foo').invalid).toBe(true);
  //   expect(field.at('foo').error).toBe(111);
  //
  //   expect(field.at('bar').invalid).toBe(false);
  //   expect(field.at('bar').error).toBe(null);
  // });
  //
  // test('validate does not clear an error set by the user', () => {
  //   const field = createField(
  //     objectAccessor,
  //     { foo: 0, bar: 'qux' },
  //     validationPlugin((field, applyError) => {
  //       applyError(field.at('foo'), 111);
  //     })
  //   );
  //
  //   field.at('bar').setError(222);
  //
  //   field.validate();
  //
  //   expect(field.invalid).toBe(true);
  //   expect(field.error).toBe(null);
  //
  //   expect(field.at('foo').invalid).toBe(true);
  //   expect(field.at('foo').error).toEqual(111);
  //
  //   expect(field.at('bar').invalid).toBe(true);
  //   expect(field.at('bar').error).toBe(222);
  // });
  //
  // test('validate does not raise errors for transient fields', () => {
  //   const field = createField(
  //     objectAccessor,
  //     { foo: 0, bar: 'qux' },
  //     validationPlugin((field, applyError) => {
  //       applyError(field.at('foo'), 111);
  //       applyError(field.at('bar'), 222);
  //     })
  //   );
  //
  //   field.at('bar').setValue('aaabbb');
  //
  //   field.validate();
  //
  //   expect(field.invalid).toBe(true);
  //   expect(field.error).toBe(null);
  //
  //   expect(field.at('foo').invalid).toBe(true);
  //   expect(field.at('foo').error).toBe(111);
  //
  //   expect(field.at('bar').invalid).toBe(false);
  //   expect(field.at('bar').error).toBe(null);
  // });
});
