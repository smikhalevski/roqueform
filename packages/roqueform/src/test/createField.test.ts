import { createField, objectAccessor } from '../main';

describe('createField', () => {
  test('creates a field without an initial value', () => {
    const field = createField(objectAccessor);

    expect(field.parent).toBe(null);
    expect(field.key).toBe(null);
    expect(field.getValue()).toBe(undefined);
    expect(field.isTransient()).toBe(false);
  });

  test('creates a field with the initial value', () => {
    const field = createField(objectAccessor, 111);

    expect(field.getValue()).toBe(111);
  });

  test('returns a field at key', () => {
    const field0 = createField(objectAccessor, { foo: 111 });

    const field1 = field0.at('foo');

    expect(field1.parent).toBe(field0);
    expect(field1.key).toBe('foo');
    expect(field1.getValue()).toBe(111);
  });

  test('returns the same field for a key', () => {
    const field = createField(objectAccessor, { foo: 111 });

    expect(field.at('foo')).toBe(field.at('foo'));
  });

  test('dispatches value to a root field', () => {
    const field = createField(objectAccessor, 111);

    field.dispatchValue(222);

    expect(field.getValue()).toBe(222);
    expect(field.isTransient()).toBe(false);
  });

  test('dispatches value to a derived field', () => {
    const field0 = createField(objectAccessor, { foo: 111 });

    const field1 = field0.at('foo');

    field1.dispatchValue(222);

    expect(field0.getValue()).toEqual({ foo: 222 });
    expect(field0.isTransient()).toBe(false);

    expect(field1.getValue()).toBe(222);
    expect(field1.isTransient()).toBe(false);
  });

  test('invokes subscriber during value dispatch', () => {
    const listenerMock0 = jest.fn();
    const listenerMock1 = jest.fn();

    const field0 = createField(objectAccessor, { foo: 111 });
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

    expect(field.getValue()).toBe(222);
    expect(field.isTransient()).toBe(true);
  });

  test('sets value to a derived field', () => {
    const initialValue = { foo: 111 };

    const field0 = createField(objectAccessor, initialValue);

    const field1 = field0.at('foo');

    field1.setValue(222);

    expect(field0.getValue()).toBe(initialValue);
    expect(field0.isTransient()).toBe(false);

    expect(field1.getValue()).toBe(222);
    expect(field1.isTransient()).toBe(true);
  });

  test('dispatches the value after it was set to a derived field', () => {
    const field0 = createField(objectAccessor, { foo: 111 });

    const field1 = field0.at('foo');

    field1.setValue(222);
    field1.dispatch();

    expect(field0.getValue()).toEqual({ foo: 222 });
    expect(field0.isTransient()).toBe(false);

    expect(field1.getValue()).toBe(222);
    expect(field1.isTransient()).toBe(false);
  });

  test('invokes subscriber during value set', () => {
    const listenerMock0 = jest.fn();
    const listenerMock1 = jest.fn();

    const field0 = createField(objectAccessor, { foo: 111 });
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

    const field0 = createField(objectAccessor, { foo: 111 });
    field0.subscribe(listenerMock0);

    const field1 = field0.at('foo');
    field1.subscribe(listenerMock1);

    const nextValue = { foo: 333 };
    field0.dispatchValue(nextValue);

    expect(listenerMock0).toHaveBeenCalledTimes(1);
    expect(listenerMock1).toHaveBeenCalledTimes(1);

    expect(field0.getValue()).toBe(nextValue);
    expect(field0.isTransient()).toBe(false);

    expect(field1.getValue()).toBe(333);
    expect(field1.isTransient()).toBe(false);
  });

  test('does not propagate new value to the transient derived field', () => {
    const listenerMock0 = jest.fn();
    const listenerMock1 = jest.fn();

    const field0 = createField(objectAccessor, { foo: 111 });
    field0.subscribe(listenerMock0);

    const field1 = field0.at('foo');
    field1.subscribe(listenerMock1);

    field1.setValue(222);
    field0.dispatchValue({ foo: 333 });

    expect(listenerMock0).toHaveBeenCalledTimes(1);
    expect(listenerMock1).toHaveBeenCalledTimes(1);

    expect(field1.getValue()).toBe(222);
    expect(field1.isTransient()).toBe(true);
  });

  test('does not notify subscribers if value of the derived field did not change', () => {
    const listenerMock0 = jest.fn();
    const listenerMock1 = jest.fn();

    const fooValue = { bar: 111 };

    const field0 = createField(objectAccessor, { foo: fooValue });
    field0.subscribe(listenerMock0);

    const field1 = field0.at('foo');
    field1.subscribe(listenerMock1);

    field0.dispatchValue({ foo: fooValue });

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

  test('applies plugin to the root field', () => {
    let field0;
    const pluginMock = jest.fn(field => (field0 = Object.assign({}, field)));

    const field1 = createField(objectAccessor, 111, pluginMock);

    expect(field1).toBe(field0);

    expect(pluginMock).toHaveBeenCalledTimes(1);
    expect(pluginMock).toHaveBeenNthCalledWith(1, field1);
  });

  test('returns field if plugin returns undefined', () => {
    const pluginMock = jest.fn();

    const field = createField(objectAccessor, 111, pluginMock);

    expect(field.getValue()).toBe(111);

    expect(pluginMock).toHaveBeenCalledTimes(1);
    expect(pluginMock).toHaveBeenNthCalledWith(1, field);
  });

  test('applies plugin to the derived field', () => {
    let field0;
    const pluginMock = jest.fn(field => (field0 = Object.assign({}, field)));

    const field = createField(objectAccessor, { foo: 111 }, pluginMock);

    expect(field.at('foo')).toBe(field0);

    expect(pluginMock).toHaveBeenCalledTimes(2);
  });

  test('actual parent value in derived field listener', (done) => {
    const field = createField(objectAccessor, { foo: 111 });
    const newValue = { foo: 222 };

    field.at('foo').subscribe((targetField) => {
      expect(targetField.getValue()).toBe(newValue);
      done();
    });

    field.dispatchValue(newValue);
  });
});
