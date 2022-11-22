import { createField, objectAccessor } from '../main';

describe('createField', () => {
  test('creates a field without an initial value', () => {
    const field = createField(objectAccessor);

    expect(field.parent).toBe(null);
    expect(field.key).toBe(null);
    expect(field.value).toBe(undefined);
    expect(field.transient).toBe(false);
  });

  test('creates a field with the initial value', () => {
    const field = createField(objectAccessor, 111);

    expect(field.value).toBe(111);
  });

  test('returns a field at key', () => {
    const field = createField(objectAccessor, { foo: 111 });

    expect(field.at('foo').parent).toBe(field);
    expect(field.at('foo').key).toBe('foo');
    expect(field.at('foo').value).toBe(111);
  });

  test('returns the same field for the same key', () => {
    const field = createField(objectAccessor, { foo: 111 });

    expect(field.at('foo')).toBe(field.at('foo'));
  });

  test('dispatches a value to a root field', () => {
    const field = createField(objectAccessor, 111);

    field.setValue(222);

    expect(field.value).toBe(222);
    expect(field.transient).toBe(false);
  });

  test('dispatches a value to a derived field', () => {
    const field = createField(objectAccessor, { foo: 111 });

    field.at('foo').setValue(222);

    expect(field.value).toEqual({ foo: 222 });
    expect(field.transient).toBe(false);

    expect(field.at('foo').value).toBe(222);
    expect(field.at('foo').transient).toBe(false);
  });

  test('invokes a subscriber during value dispatch', () => {
    const listenerMock = jest.fn();
    const fooListenerMock = jest.fn();

    const field = createField(objectAccessor, { foo: 111 });
    field.subscribe(listenerMock);

    field.at('foo').subscribe(fooListenerMock);

    field.at('foo').setValue(222);

    expect(listenerMock).toHaveBeenCalledTimes(1);
    expect(listenerMock).toHaveBeenNthCalledWith(1, field.at('foo'), field);

    expect(fooListenerMock).toHaveBeenCalledTimes(1);
    expect(fooListenerMock).toHaveBeenNthCalledWith(1, field.at('foo'), field.at('foo'));
  });

  test('sets a value to a root field', () => {
    const field = createField(objectAccessor, 111);

    field.setTransientValue(222);

    expect(field.value).toBe(222);
    expect(field.transient).toBe(true);
  });

  test('sets a value to a derived field', () => {
    const initialValue = { foo: 111 };

    const field = createField(objectAccessor, initialValue);

    field.at('foo').setTransientValue(222);

    expect(field.value).toBe(initialValue);
    expect(field.transient).toBe(false);

    expect(field.at('foo').value).toBe(222);
    expect(field.at('foo').transient).toBe(true);
  });

  test('dispatches a value after it was set to a derived field', () => {
    const field = createField(objectAccessor, { foo: 111 });

    field.at('foo').setTransientValue(222);
    field.at('foo').dispatch();

    expect(field.value).toEqual({ foo: 222 });
    expect(field.transient).toBe(false);

    expect(field.at('foo').value).toBe(222);
    expect(field.at('foo').transient).toBe(false);
  });

  test('invokes a subscriber during value set', () => {
    const listenerMock = jest.fn();
    const fooListenerMock = jest.fn();

    const field = createField(objectAccessor, { foo: 111 });
    field.subscribe(listenerMock);

    field.at('foo').subscribe(fooListenerMock);
    field.at('foo').setTransientValue(222);

    expect(listenerMock).toHaveBeenCalledTimes(0);

    expect(fooListenerMock).toHaveBeenCalledTimes(1);
    expect(fooListenerMock).toHaveBeenNthCalledWith(1, field.at('foo'), field.at('foo'));
  });

  test('does not leave the form in an inconsistent state if a listener throws an error', () => {
    const fooListenerMock = jest.fn(() => {
      throw new Error('fooExpected');
    });
    const barListenerMock = jest.fn(() => {
      throw new Error('barExpected');
    });

    const field = createField(objectAccessor, { foo: 111, bar: 222 });

    field.at('foo').subscribe(fooListenerMock);
    field.at('bar').subscribe(barListenerMock);

    expect(() => field.setValue({ foo: 333, bar: 444 })).toThrow(new Error('fooExpected'));

    expect(fooListenerMock).toHaveBeenCalledTimes(1);
    expect(barListenerMock).toHaveBeenCalledTimes(1);
    expect(field.at('foo').value).toBe(333);
    expect(field.at('bar').value).toBe(444);
  });

  test('calls all listeners and throws the first caught error', () => {
    const listenerMock1 = jest.fn(() => {
      throw new Error('expected1');
    });
    const listenerMock2 = jest.fn(() => {
      throw new Error('expected2');
    });

    const field = createField(objectAccessor, { foo: 111, bar: 222 });

    field.at('foo').subscribe(listenerMock1);
    field.at('foo').subscribe(listenerMock2);

    expect(() => field.setValue({ foo: 333, bar: 444 })).toThrow(new Error('expected1'));

    expect(listenerMock1).toHaveBeenCalledTimes(1);
    expect(listenerMock2).toHaveBeenCalledTimes(1);
    expect(field.at('foo').value).toBe(333);
    expect(field.at('bar').value).toBe(444);
  });

  test('propagates a new value to the derived field', () => {
    const listenerMock = jest.fn();
    const fooListenerMock = jest.fn();

    const field = createField(objectAccessor, { foo: 111 });
    field.subscribe(listenerMock);

    field.at('foo').subscribe(fooListenerMock);

    const nextValue = { foo: 333 };
    field.setValue(nextValue);

    expect(listenerMock).toHaveBeenCalledTimes(1);
    expect(fooListenerMock).toHaveBeenCalledTimes(1);

    expect(field.value).toBe(nextValue);
    expect(field.transient).toBe(false);

    expect(field.at('foo').value).toBe(333);
    expect(field.at('foo').transient).toBe(false);
  });

  test('does not propagate a new value to the transient derived field', () => {
    const listenerMock = jest.fn();
    const fooListenerMock = jest.fn();

    const field = createField(objectAccessor, { foo: 111 });
    field.subscribe(listenerMock);

    field.at('foo').subscribe(fooListenerMock);
    field.at('foo').setTransientValue(222);

    field.setValue({ foo: 333 });

    expect(listenerMock).toHaveBeenCalledTimes(1);
    expect(fooListenerMock).toHaveBeenCalledTimes(1);

    expect(field.at('foo').value).toBe(222);
    expect(field.at('foo').transient).toBe(true);
  });

  test('does not notify subscribers if a value of the derived field did not change', () => {
    const listenerMock = jest.fn();
    const fooListenerMock = jest.fn();

    const fooValue = { bar: 111 };

    const field = createField(objectAccessor, { foo: fooValue });
    field.subscribe(listenerMock);

    field.at('foo').subscribe(fooListenerMock);

    field.setValue({ foo: fooValue });

    expect(listenerMock).toHaveBeenCalledTimes(1);
    expect(listenerMock).toHaveBeenNthCalledWith(1, field, field);

    expect(fooListenerMock).toHaveBeenCalledTimes(0);
  });

  test('notifies subscribers', () => {
    const listenerMock = jest.fn();

    const field = createField(objectAccessor);
    field.subscribe(listenerMock);

    field.notify();

    expect(listenerMock).toHaveBeenCalledTimes(1);
  });

  test('applies a plugin to the root field', () => {
    let fieldClone;
    const pluginMock = jest.fn(field => (fieldClone = Object.assign({}, field)));

    const field = createField(objectAccessor, 111, pluginMock);

    expect(field).toBe(fieldClone);

    expect(pluginMock).toHaveBeenCalledTimes(1);
    expect(pluginMock).toHaveBeenNthCalledWith(1, field, objectAccessor);
  });

  test('returns a field if plugin returns undefined', () => {
    const pluginMock = jest.fn();

    const field = createField(objectAccessor, 111, pluginMock);

    expect(field.value).toBe(111);

    expect(pluginMock).toHaveBeenCalledTimes(1);
    expect(pluginMock).toHaveBeenNthCalledWith(1, field, objectAccessor);
  });

  test('applies a plugin to the derived field', () => {
    let fieldClone;
    const pluginMock = jest.fn(field => (fieldClone = Object.assign({}, field)));

    const field = createField(objectAccessor, { foo: 111 }, pluginMock);

    expect(field.at('foo')).toBe(fieldClone);

    expect(pluginMock).toHaveBeenCalledTimes(2);
  });

  test('actual parent value in derived field listener', done => {
    const field = createField(objectAccessor, { foo: 111 });
    const newValue = { foo: 222 };

    field.at('foo').subscribe(targetField => {
      expect(targetField).toBe(field);
      expect(targetField.value).toBe(newValue);
      done();
    });

    field.setValue(newValue);
  });
});
