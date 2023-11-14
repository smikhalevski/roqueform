import { createField, naturalValueAccessor } from '../main';

jest.useFakeTimers();

beforeEach(() => {
  jest.clearAllTimers();
});

describe('createField', () => {
  test('creates a field without an initial value', () => {
    const field = createField();

    expect(field.key).toBeNull();
    expect(field.value).toBeUndefined();
    expect(field.initialValue).toBeUndefined();
    expect(field.isTransient).toBe(false);
    expect(field.rootField).toBe(field);
    expect(field.parentField).toBeNull();
    expect(field.children).toBeNull();
    expect(field.subscribers).toEqual({});
    expect(field.valueAccessor).toBe(naturalValueAccessor);
  });

  test('creates a field with the initial value', () => {
    const field = createField(111);

    expect(field.value).toBe(111);
    expect(field.initialValue).toBe(111);
  });

  test('returns a field at key', () => {
    const field = createField({ aaa: 111 });

    const child = field.at('aaa');

    expect(child.rootField).toBe(field);
    expect(child.parentField).toBe(field);
    expect(child.key).toBe('aaa');
    expect(child.value).toBe(111);
    expect(child.initialValue).toBe(111);

    expect(field.children).toEqual([child]);
  });

  test('returns the same field for the same key', () => {
    const field = createField({ aaa: 111 });

    expect(field.at('aaa')).toBe(field.at('aaa'));
  });

  test('sets a value to a root field', () => {
    const field = createField(111);

    field.setValue(222);

    expect(field.value).toBe(222);
    expect(field.initialValue).toBe(111);
    expect(field.isTransient).toBe(false);
  });

  test('sets a value to a child field', () => {
    const initialValue = { aaa: 111 };

    const field = createField(initialValue);

    field.at('aaa').setValue(222);

    expect(field.value).not.toBe(initialValue);
    expect(field.value).toEqual({ aaa: 222 });
    expect(field.initialValue).toEqual(initialValue);
    expect(field.isTransient).toBe(false);

    expect(field.at('aaa').value).toBe(222);
    expect(field.at('aaa').initialValue).toBe(111);
    expect(field.at('aaa').isTransient).toBe(false);
  });

  test('calls a glob subscriber when value is updated', () => {
    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();

    const field = createField({ aaa: 111 });
    field.on('*', subscriberMock);

    field.at('aaa').on('*', aaaSubscriberMock);

    field.at('aaa').setValue(222);

    expect(subscriberMock).toHaveBeenCalledTimes(2);
    expect(subscriberMock).toHaveBeenNthCalledWith(1, {
      type: 'change:value',
      targetField: field,
      originField: field.at('aaa'),
      data: { aaa: 111 },
    });
    expect(subscriberMock).toHaveBeenNthCalledWith(2, {
      type: 'change:value',
      targetField: field.at('aaa'),
      originField: field.at('aaa'),
      data: 111,
    });

    expect(aaaSubscriberMock).toHaveBeenCalledTimes(1);
    expect(aaaSubscriberMock).toHaveBeenNthCalledWith(1, {
      type: 'change:value',
      targetField: field.at('aaa'),
      originField: field.at('aaa'),
      data: 111,
    });
  });

  test('calls a type subscriber when value is updated', () => {
    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();

    const field = createField({ aaa: 111 });
    field.on('change:value', subscriberMock);

    field.at('aaa').on('change:value', aaaSubscriberMock);

    field.at('aaa').setValue(222);

    expect(subscriberMock).toHaveBeenCalledTimes(2);
    expect(subscriberMock).toHaveBeenNthCalledWith(1, {
      type: 'change:value',
      targetField: field,
      originField: field.at('aaa'),
      data: { aaa: 111 },
    });
    expect(subscriberMock).toHaveBeenNthCalledWith(2, {
      type: 'change:value',
      targetField: field.at('aaa'),
      originField: field.at('aaa'),
      data: 111,
    });

    expect(aaaSubscriberMock).toHaveBeenCalledTimes(1);
    expect(aaaSubscriberMock).toHaveBeenNthCalledWith(1, {
      type: 'change:value',
      targetField: field.at('aaa'),
      originField: field.at('aaa'),
      data: 111,
    });
  });

  test('does not invoke the subscriber of the unchanged sibling field', () => {
    const aaaSubscriberMock = jest.fn();
    const bbbSubscriberMock = jest.fn();

    const field = createField({ aaa: 111, bbb: 'aaa' });

    field.at('aaa').on('*', aaaSubscriberMock);
    field.at('bbb').on('*', bbbSubscriberMock);

    field.at('aaa').setValue(222);

    expect(bbbSubscriberMock).not.toHaveBeenCalled();

    expect(aaaSubscriberMock).toHaveBeenCalledTimes(1);
    expect(aaaSubscriberMock).toHaveBeenNthCalledWith(1, {
      type: 'change:value',
      targetField: field.at('aaa'),
      originField: field.at('aaa'),
      data: 111,
    });
  });

  test('does not invoke the subscriber of the unchanged child field', () => {
    const aaaSubscriberMock = jest.fn();
    const bbbSubscriberMock = jest.fn();

    const field = createField({ aaa: 111, bbb: 'aaa' });

    field.at('aaa').on('*', aaaSubscriberMock);
    field.at('bbb').on('*', bbbSubscriberMock);

    field.setValue({ aaa: 222, bbb: 'aaa' });

    expect(bbbSubscriberMock).not.toHaveBeenCalled();
    expect(aaaSubscriberMock).toHaveBeenCalledTimes(1);
  });

  test('sets a value to a root field', () => {
    const field = createField(111);

    field.setTransientValue(222);

    expect(field.value).toBe(222);
    expect(field.isTransient).toBe(true);
  });

  test('sets a value to a child field', () => {
    const initialValue = { aaa: 111 };

    const field = createField(initialValue);

    field.at('aaa').setTransientValue(222);

    expect(field.value).toBe(initialValue);
    expect(field.isTransient).toBe(false);

    expect(field.at('aaa').value).toBe(222);
    expect(field.at('aaa').isTransient).toBe(true);
  });

  test('propagates a value after it was set to a child field', () => {
    const field = createField({ aaa: 111 });

    field.at('aaa').setTransientValue(222);
    field.at('aaa').propagate();

    expect(field.value).toEqual({ aaa: 222 });
    expect(field.isTransient).toBe(false);

    expect(field.at('aaa').value).toBe(222);
    expect(field.at('aaa').isTransient).toBe(false);
  });

  test('invokes a subscriber when a value is updated transiently', () => {
    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();

    const field = createField({ aaa: 111 });
    field.on('*', subscriberMock);

    field.at('aaa').on('*', aaaSubscriberMock);
    field.at('aaa').setTransientValue(222);

    expect(subscriberMock).toHaveBeenCalledTimes(1);
    expect(aaaSubscriberMock).toHaveBeenCalledTimes(1);
  });

  test('does not leave fields in an inconsistent state if a subscriber throws an error', () => {
    const aaaSubscriberMock = jest.fn(() => {
      throw new Error('aaaExpected');
    });
    const bbbSubscriberMock = jest.fn(() => {
      throw new Error('bbbExpected');
    });

    const field = createField({ aaa: 111, bbb: 222 });

    field.at('aaa').on('*', aaaSubscriberMock);
    field.at('bbb').on('*', bbbSubscriberMock);

    try {
      field.setValue({ aaa: 333, bbb: 444 });
    } catch {}

    expect(aaaSubscriberMock).toHaveBeenCalledTimes(1);
    expect(bbbSubscriberMock).toHaveBeenCalledTimes(0);
    expect(field.at('aaa').value).toBe(333);
    expect(field.at('bbb').value).toBe(444);
  });

  test('propagates a new value to the child field', () => {
    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();

    const field = createField({ aaa: 111 });
    field.on('*', subscriberMock);

    field.at('aaa').on('*', aaaSubscriberMock);

    const nextValue = { aaa: 333 };
    field.setValue(nextValue);

    expect(subscriberMock).toHaveBeenCalledTimes(2);
    expect(aaaSubscriberMock).toHaveBeenCalledTimes(1);

    expect(field.value).toBe(nextValue);
    expect(field.isTransient).toBe(false);

    expect(field.at('aaa').value).toBe(333);
    expect(field.at('aaa').isTransient).toBe(false);
  });

  test('does not propagate a new value to the transient child field', () => {
    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();

    const field = createField({ aaa: 111 });
    field.on('*', subscriberMock);

    field.at('aaa').on('*', aaaSubscriberMock);
    field.at('aaa').setTransientValue(222);

    field.setValue({ aaa: 333 });

    expect(subscriberMock).toHaveBeenCalledTimes(2);
    expect(aaaSubscriberMock).toHaveBeenCalledTimes(1);

    expect(field.at('aaa').value).toBe(222);
    expect(field.at('aaa').isTransient).toBe(true);
  });

  test('does not notify subscribers if a value of the child field did not change', () => {
    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();

    const aaaValue = { bbb: 111 };
    const initialValue = { aaa: aaaValue };

    const field = createField(initialValue);
    field.on('*', subscriberMock);

    field.at('aaa').on('*', aaaSubscriberMock);

    field.setValue({ aaa: aaaValue });

    expect(subscriberMock).toHaveBeenCalledTimes(1);
    expect(subscriberMock).toHaveBeenNthCalledWith(1, {
      type: 'change:value',
      targetField: field,
      originField: field,
      data: initialValue,
    });

    expect(aaaSubscriberMock).toHaveBeenCalledTimes(0);
  });

  test('applies a plugin to the root field', () => {
    const pluginMock = jest.fn();

    const field = createField(111, pluginMock);

    expect(pluginMock).toHaveBeenCalledTimes(1);
    expect(pluginMock).toHaveBeenNthCalledWith(1, field);
  });

  test('applies a plugin to the child field', () => {
    const pluginMock = jest.fn();

    const field = createField({ aaa: 111 }, pluginMock);

    const aaaField = field.at('aaa');

    expect(pluginMock).toHaveBeenCalledTimes(2);
    expect(pluginMock).toHaveBeenNthCalledWith(1, field);
    expect(pluginMock).toHaveBeenNthCalledWith(2, aaaField);
  });

  test('an actual parent value is visible in the child field subscriber', done => {
    const field = createField({ aaa: 111 });

    field.at('aaa').on('*', event => {
      expect(event.targetField.value).toBe(222);
      done();
    });

    field.setValue({ aaa: 222 });
  });

  test('does not cache a child field for which the plugin has thrown an error', () => {
    const pluginMock = jest.fn();
    pluginMock.mockImplementationOnce(() => undefined);
    pluginMock.mockImplementationOnce(() => {
      throw new Error('expected1');
    });
    pluginMock.mockImplementationOnce(() => {
      throw new Error('expected2');
    });

    const field = createField({ aaa: 111 }, pluginMock);

    expect(() => field.at('aaa')).toThrow(new Error('expected1'));
    expect(() => field.at('aaa')).toThrow(new Error('expected2'));
  });

  test('setting field value in a subscriber does not trigger an infinite loop', () => {
    const field = createField(111);

    const subscriberMock = jest.fn(() => {
      field.setValue(333);
    });

    field.on('*', subscriberMock);

    field.setValue(222);

    expect(field.value).toBe(333);
    expect(subscriberMock).toHaveBeenCalledTimes(2);
  });

  test('setting field value in a child field subscriber does not trigger an infinite loop', () => {
    const field = createField({ aaa: 111 });

    const subscriberMock = jest.fn(() => {
      field.at('aaa').setValue(333);
    });

    field.on('*', subscriberMock);

    field.at('aaa').setValue(222);

    expect(field.value.aaa).toBe(333);
    expect(subscriberMock).toHaveBeenCalledTimes(4);
  });
});
