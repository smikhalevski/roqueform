import { createField, naturalAccessor, Plugin } from '../main';

jest.useFakeTimers();

beforeEach(() => {
  jest.clearAllTimers();
});

describe('createField', () => {
  test('creates a field without an initial value', () => {
    const field = createField();

    expect(field.parent).toBe(null);
    expect(field.key).toBe(null);
    expect(field.value).toBe(undefined);
    expect(field.isTransient).toBe(false);
  });

  test('creates a field with the initial value', () => {
    const field = createField(111);

    expect(field.value).toBe(111);
  });

  test('returns a field at key', () => {
    const field = createField({ foo: 111 });

    expect(field.at('foo').parent).toBe(field);
    expect(field.at('foo').key).toBe('foo');
    expect(field.at('foo').value).toBe(111);
  });

  test('returns the same field for the same key', () => {
    const field = createField({ foo: 111 });

    expect(field.at('foo')).toBe(field.at('foo'));
  });

  test('dispatches a value to a root field', () => {
    const field = createField(111);

    field.setValue(222);

    expect(field.value).toBe(222);
    expect(field.isTransient).toBe(false);
  });

  test('dispatches a value to a derived field', () => {
    const field = createField({ foo: 111 });

    field.at('foo').setValue(222);

    expect(field.value).toEqual({ foo: 222 });
    expect(field.isTransient).toBe(false);

    expect(field.at('foo').value).toBe(222);
    expect(field.at('foo').isTransient).toBe(false);
  });

  test('invokes a subscriber when value is updated', () => {
    const subscriberMock = jest.fn();
    const fooListenerMock = jest.fn();

    const field = createField({ foo: 111 });
    field.subscribe(subscriberMock);

    field.at('foo').subscribe(fooListenerMock);

    field.at('foo').setValue(222);

    expect(subscriberMock).toHaveBeenCalledTimes(1);
    expect(subscriberMock).toHaveBeenNthCalledWith(1, field.at('foo'), field);

    expect(fooListenerMock).toHaveBeenCalledTimes(1);
    expect(fooListenerMock).toHaveBeenNthCalledWith(1, field.at('foo'), field.at('foo'));
  });

  test('does not invoke the subscriber of the unchanged sibling field', () => {
    const fooListenerMock = jest.fn();
    const barListenerMock = jest.fn();

    const field = createField({ foo: 111, bar: 'aaa' });

    field.at('foo').subscribe(fooListenerMock);
    field.at('bar').subscribe(barListenerMock);

    field.at('foo').setValue(222);

    expect(barListenerMock).not.toHaveBeenCalled();

    expect(fooListenerMock).toHaveBeenCalledTimes(1);
    expect(fooListenerMock).toHaveBeenNthCalledWith(1, field.at('foo'), field.at('foo'));
  });

  test('does not invoke the subscriber of the unchanged derived field', () => {
    const fooListenerMock = jest.fn();
    const barListenerMock = jest.fn();

    const field = createField({ foo: 111, bar: 'aaa' });

    field.at('foo').subscribe(fooListenerMock);
    field.at('bar').subscribe(barListenerMock);

    field.setValue({ foo: 222, bar: 'aaa' });

    expect(barListenerMock).not.toHaveBeenCalled();

    expect(fooListenerMock).toHaveBeenCalledTimes(1);
    expect(fooListenerMock).toHaveBeenNthCalledWith(1, field, field.at('foo'));
  });

  test('sets a value to a root field', () => {
    const field = createField(111);

    field.setTransientValue(222);

    expect(field.value).toBe(222);
    expect(field.isTransient).toBe(true);
  });

  test('sets a value to a derived field', () => {
    const initialValue = { foo: 111 };

    const field = createField(initialValue);

    field.at('foo').setTransientValue(222);

    expect(field.value).toBe(initialValue);
    expect(field.isTransient).toBe(false);

    expect(field.at('foo').value).toBe(222);
    expect(field.at('foo').isTransient).toBe(true);
  });

  test('dispatches a value after it was set to a derived field', () => {
    const field = createField({ foo: 111 });

    field.at('foo').setTransientValue(222);
    field.at('foo').dispatch();

    expect(field.value).toEqual({ foo: 222 });
    expect(field.isTransient).toBe(false);

    expect(field.at('foo').value).toBe(222);
    expect(field.at('foo').isTransient).toBe(false);
  });

  test('invokes a subscriber when a value is updated transiently', () => {
    const subscriberMock = jest.fn();
    const fooListenerMock = jest.fn();

    const field = createField({ foo: 111 });
    field.subscribe(subscriberMock);

    field.at('foo').subscribe(fooListenerMock);
    field.at('foo').setTransientValue(222);

    expect(subscriberMock).toHaveBeenCalledTimes(0);

    expect(fooListenerMock).toHaveBeenCalledTimes(1);
    expect(fooListenerMock).toHaveBeenNthCalledWith(1, field.at('foo'), field.at('foo'));
  });

  test('does not leave the form in an inconsistent state if a subscriber throws an error', () => {
    const fooListenerMock = jest.fn(() => {
      throw new Error('fooExpected');
    });
    const barListenerMock = jest.fn(() => {
      throw new Error('barExpected');
    });

    const field = createField({ foo: 111, bar: 222 });

    field.at('foo').subscribe(fooListenerMock);
    field.at('bar').subscribe(barListenerMock);

    field.setValue({ foo: 333, bar: 444 });

    expect(fooListenerMock).toHaveBeenCalledTimes(1);
    expect(barListenerMock).toHaveBeenCalledTimes(1);
    expect(field.at('foo').value).toBe(333);
    expect(field.at('bar').value).toBe(444);

    expect(() => jest.runAllTimers()).toThrow(new Error('fooExpected'));
    expect(() => jest.runAllTimers()).toThrow(new Error('barExpected'));
  });

  test('calls all subscribers and throws error asynchronously', () => {
    const subscriberMock1 = jest.fn(() => {
      throw new Error('expected1');
    });
    const subscriberMock2 = jest.fn(() => {
      throw new Error('expected2');
    });

    const field = createField({ foo: 111, bar: 222 });

    field.at('foo').subscribe(subscriberMock1);
    field.at('foo').subscribe(subscriberMock2);

    field.setValue({ foo: 333, bar: 444 });

    expect(subscriberMock1).toHaveBeenCalledTimes(1);
    expect(subscriberMock2).toHaveBeenCalledTimes(1);
    expect(field.at('foo').value).toBe(333);
    expect(field.at('bar').value).toBe(444);

    expect(() => jest.runAllTimers()).toThrow(new Error('expected1'));
    expect(() => jest.runAllTimers()).toThrow(new Error('expected2'));
  });

  test('propagates a new value to the derived field', () => {
    const subscriberMock = jest.fn();
    const fooListenerMock = jest.fn();

    const field = createField({ foo: 111 });
    field.subscribe(subscriberMock);

    field.at('foo').subscribe(fooListenerMock);

    const nextValue = { foo: 333 };
    field.setValue(nextValue);

    expect(subscriberMock).toHaveBeenCalledTimes(1);
    expect(fooListenerMock).toHaveBeenCalledTimes(1);

    expect(field.value).toBe(nextValue);
    expect(field.isTransient).toBe(false);

    expect(field.at('foo').value).toBe(333);
    expect(field.at('foo').isTransient).toBe(false);
  });

  test('does not propagate a new value to the transient derived field', () => {
    const subscriberMock = jest.fn();
    const fooListenerMock = jest.fn();

    const field = createField({ foo: 111 });
    field.subscribe(subscriberMock);

    field.at('foo').subscribe(fooListenerMock);
    field.at('foo').setTransientValue(222);

    field.setValue({ foo: 333 });

    expect(subscriberMock).toHaveBeenCalledTimes(1);
    expect(fooListenerMock).toHaveBeenCalledTimes(1);

    expect(field.at('foo').value).toBe(222);
    expect(field.at('foo').isTransient).toBe(true);
  });

  test('does not notify subscribers if a value of the derived field did not change', () => {
    const subscriberMock = jest.fn();
    const fooListenerMock = jest.fn();

    const fooValue = { bar: 111 };

    const field = createField({ foo: fooValue });
    field.subscribe(subscriberMock);

    field.at('foo').subscribe(fooListenerMock);

    field.setValue({ foo: fooValue });

    expect(subscriberMock).toHaveBeenCalledTimes(1);
    expect(subscriberMock).toHaveBeenNthCalledWith(1, field, field);

    expect(fooListenerMock).toHaveBeenCalledTimes(0);
  });

  test('applies a plugin to the root field', () => {
    const pluginMock = jest.fn();

    const field = createField(111, pluginMock);

    expect(pluginMock).toHaveBeenCalledTimes(1);
    expect(pluginMock).toHaveBeenNthCalledWith(1, field, naturalAccessor, expect.any(Function));
  });

  test('returns a field if plugin returns undefined', () => {
    const pluginMock = jest.fn();

    const field = createField(111, pluginMock);

    expect(field.value).toBe(111);

    expect(pluginMock).toHaveBeenCalledTimes(1);
    expect(pluginMock).toHaveBeenNthCalledWith(1, field, naturalAccessor, expect.any(Function));
  });

  test('applies a plugin to the derived field', () => {
    const pluginMock = jest.fn();

    const field = createField({ foo: 111 }, pluginMock);

    const fooField = field.at('foo');

    expect(pluginMock).toHaveBeenCalledTimes(2);
    expect(pluginMock).toHaveBeenNthCalledWith(1, field, naturalAccessor, expect.any(Function));
    expect(pluginMock).toHaveBeenNthCalledWith(2, fooField, naturalAccessor, expect.any(Function));
  });

  test('plugin notifies field subscribers', () => {
    let notifyCallback1!: () => void;

    const plugin: Plugin = jest.fn().mockImplementationOnce((_field, _accessor, notify) => {
      notifyCallback1 = notify;
    });
    const subscriberMock1 = jest.fn();
    const subscriberMock2 = jest.fn();

    const field = createField({ foo: 111 }, plugin);

    field.subscribe(subscriberMock1);
    field.at('foo').subscribe(subscriberMock2);

    expect(subscriberMock1).not.toHaveBeenCalled();
    expect(subscriberMock2).not.toHaveBeenCalled();

    notifyCallback1();

    expect(subscriberMock1).toHaveBeenCalledTimes(1);
    expect(subscriberMock2).not.toHaveBeenCalled();
  });

  test('plugin notifies derived field subscribers', () => {
    let notifyCallback1!: () => void;

    const plugin: Plugin = jest
      .fn()
      .mockImplementationOnce(() => undefined)
      .mockImplementationOnce((_field, _accessor, notify) => {
        notifyCallback1 = notify;
      });

    const subscriberMock1 = jest.fn();
    const subscriberMock2 = jest.fn();

    const field = createField({ foo: 111 }, plugin);

    field.subscribe(subscriberMock1);
    field.at('foo').subscribe(subscriberMock2);

    expect(subscriberMock1).not.toHaveBeenCalled();
    expect(subscriberMock2).not.toHaveBeenCalled();

    notifyCallback1();

    expect(subscriberMock1).not.toHaveBeenCalled();
    expect(subscriberMock2).toHaveBeenCalledTimes(1);
  });

  test('an actual parent value is visible in the derived field subscriber', done => {
    const field = createField({ foo: 111 });
    const newValue = { foo: 222 };

    field.at('foo').subscribe(updatedField => {
      expect(updatedField).toBe(field);
      expect(updatedField.value).toBe(newValue);
      done();
    });

    field.setValue(newValue);
  });

  test('does not cache a derived field for which the plugin has thrown an error', () => {
    const pluginMock = jest.fn();
    pluginMock.mockImplementationOnce(() => undefined);
    pluginMock.mockImplementationOnce(() => {
      throw new Error('expected1');
    });
    pluginMock.mockImplementationOnce(() => {
      throw new Error('expected2');
    });

    const field = createField({ foo: 111 }, pluginMock);

    expect(() => field.at('foo')).toThrow(new Error('expected1'));
    expect(() => field.at('foo')).toThrow(new Error('expected2'));
  });

  test('setting field value in a subscriber does not trigger an infinite loop', () => {
    const field = createField(111);

    const subscriberMock = jest.fn(() => {
      field.setValue(333);
    });

    field.subscribe(subscriberMock);

    field.setValue(222);

    expect(field.value).toBe(333);
    expect(subscriberMock).toHaveBeenCalledTimes(2);
  });

  test('setting field value in a derived field subscriber does not trigger an infinite loop', () => {
    const field = createField({ foo: 111 });

    const subscriberMock = jest.fn(() => {
      field.at('foo').setValue(333);
    });

    field.subscribe(subscriberMock);

    field.at('foo').setValue(222);

    expect(field.value.foo).toBe(333);
    expect(subscriberMock).toHaveBeenCalledTimes(2);
  });
});
