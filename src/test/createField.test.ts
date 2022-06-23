import {createField, objectAccessor} from '../main';

describe('createField', () => {

  test('creates a field without an initial value', () => {
    const field = createField(objectAccessor);

    expect(field.value).toBe(undefined);
    expect(field.transient).toBe(false);
  });

  test('creates a field with the initial value', () => {
    const field = createField(objectAccessor, 111);

    expect(field.value).toBe(111);
  });

  test('returns a field at key', () => {
    const field = createField(objectAccessor, {foo: 111});

    expect(field.at('foo').value).toBe(111);
  });

  test('returns the same field for a key', () => {
    const field = createField(objectAccessor, {foo: 111});

    expect(field.at('foo')).toBe(field.at('foo'));
  });

  test('dispatches value to a root field', () => {
    const field = createField(objectAccessor, 111);

    field.dispatchValue(222);

    expect(field.value).toBe(222);
    expect(field.transient).toBe(false);
  });

  test('dispatches value to a derived field', () => {
    const field0 = createField(objectAccessor, {foo: 111});

    const field1 = field0.at('foo');

    field1.dispatchValue(222);

    expect(field0.value).toEqual({foo: 222});
    expect(field0.transient).toBe(false);

    expect(field1.value).toBe(222);
    expect(field1.transient).toBe(false);
  });

  test('invokes subscriber during value dispatch', () => {
    const listenerMock0 = jest.fn();
    const listenerMock1 = jest.fn();

    const field0 = createField(objectAccessor, {foo: 111});
    field0.subscribe(listenerMock0);

    const field1 = field0.at('foo');
    field1.subscribe(listenerMock1);

    field1.dispatchValue(222);

    expect(listenerMock0).toHaveBeenCalledTimes(1);
    expect(listenerMock1).toHaveBeenCalledTimes(1);
  });

  test('sets value to a root field', () => {
    const field = createField(objectAccessor, 111);

    field.setValue(222);

    expect(field.value).toBe(222);
    expect(field.transient).toBe(true);
  });

  test('sets value to a derived field', () => {
    const initialValue = {foo: 111};

    const field0 = createField(objectAccessor, initialValue);

    const field1 = field0.at('foo');

    field1.setValue(222);

    expect(field0.value).toBe(initialValue);
    expect(field0.transient).toBe(false);

    expect(field1.value).toBe(222);
    expect(field1.transient).toBe(true);
  });

  test('dispatches the value after it was set to a derived field', () => {
    const field0 = createField(objectAccessor, {foo: 111});

    const field1 = field0.at('foo');

    field1.setValue(222);
    field1.dispatch();

    expect(field0.value).toEqual({foo: 222});
    expect(field0.transient).toBe(false);

    expect(field1.value).toBe(222);
    expect(field1.transient).toBe(false);
  });

  test('invokes subscriber during value set', () => {
    const listenerMock0 = jest.fn();
    const listenerMock1 = jest.fn();

    const field0 = createField(objectAccessor, {foo: 111});
    field0.subscribe(listenerMock0);

    const field1 = field0.at('foo');
    field1.subscribe(listenerMock1);

    field1.setValue(222);

    expect(listenerMock0).toHaveBeenCalledTimes(0);
    expect(listenerMock1).toHaveBeenCalledTimes(1);
  });

  test('propagates new value to the derived field', () => {
    const listenerMock0 = jest.fn();
    const listenerMock1 = jest.fn();

    const field0 = createField(objectAccessor, {foo: 111});
    field0.subscribe(listenerMock0);

    const field1 = field0.at('foo');
    field1.subscribe(listenerMock1);

    const nextValue = {foo: 333};
    field0.dispatchValue(nextValue);

    expect(listenerMock0).toHaveBeenCalledTimes(1);
    expect(listenerMock1).toHaveBeenCalledTimes(1);

    expect(field0.value).toBe(nextValue);
    expect(field0.transient).toBe(false);

    expect(field1.value).toBe(333);
    expect(field1.transient).toBe(false);
  });

  test('does not propagate new value to the transient derived field', () => {
    const listenerMock0 = jest.fn();
    const listenerMock1 = jest.fn();

    const field0 = createField(objectAccessor, {foo: 111});
    field0.subscribe(listenerMock0);

    const field1 = field0.at('foo');
    field1.subscribe(listenerMock1);

    field1.setValue(222);
    field0.dispatchValue({foo: 333});

    expect(listenerMock0).toHaveBeenCalledTimes(1);
    expect(listenerMock1).toHaveBeenCalledTimes(1);

    expect(field1.value).toBe(222);
    expect(field1.transient).toBe(true);
  });

  test('does not notify subscribers if value of the derived field did not change', () => {
    const listenerMock0 = jest.fn();
    const listenerMock1 = jest.fn();

    const fooValue = {bar: 111};

    const field0 = createField(objectAccessor, {foo: fooValue});
    field0.subscribe(listenerMock0);

    const field1 = field0.at('foo');
    field1.subscribe(listenerMock1);

    field0.dispatchValue({foo: fooValue});

    expect(listenerMock0).toHaveBeenCalledTimes(1);
    expect(listenerMock1).toHaveBeenCalledTimes(0);
  });

  test('notifies subscribers', () => {
    const listenerMock = jest.fn();

    const field = createField(objectAccessor);
    field.subscribe(listenerMock);

    field.notify();

    expect(listenerMock).toHaveBeenCalledTimes(1);
  });

  test('applies enhancer to the root field', () => {
    let field0;
    const enhancerMock = jest.fn((field) => field0 = Object.assign({}, field));

    const field1 = createField(objectAccessor, 111, enhancerMock);

    expect(field1).toBe(field0);

    expect(enhancerMock).toHaveBeenCalledTimes(1);
    expect(enhancerMock).toHaveBeenNthCalledWith(1, field1);
  });

  test('returns field if enhancer returns undefined', () => {
    const enhancerMock = jest.fn();

    const field = createField(objectAccessor, 111, enhancerMock);

    expect(field.value).toBe(111);

    expect(enhancerMock).toHaveBeenCalledTimes(1);
    expect(enhancerMock).toHaveBeenNthCalledWith(1, field);
  });

  test('applies enhancer to the derived field', () => {
    let field0;
    const enhancerMock = jest.fn((field) => field0 = Object.assign({}, field));

    const field = createField(objectAccessor, {foo: 111}, enhancerMock);

    expect(field.at('foo')).toBe(field0);

    expect(enhancerMock).toHaveBeenCalledTimes(2);
  });

});
