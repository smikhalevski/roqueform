import { beforeEach, expect, test, vi } from 'vitest';
import { createField, FieldEvent, naturalValueAccessor } from '../main/index.js';
import { FieldImpl } from '../main/__FieldImpl.js';

vi.useFakeTimers();

beforeEach(() => {
  vi.clearAllTimers();
});

test('creates a field without an initial value', () => {
  const field = createField() as FieldImpl;

  expect(field.key).toBeNull();
  expect(field.value).toBeUndefined();
  expect(field.initialValue).toBeUndefined();
  expect(field.isTransient).toBe(false);
  expect(field.parentField).toBeNull();
  expect(field.children.length).toBe(0);
  expect(field['_plugins'].length).toBe(0);
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

test('returns a field at key with the default value', () => {
  const field = createField<{ aaa?: number }>({}).at('aaa', 111);

  expect(field.value).toBe(111);
  expect(field.initialValue).toBe(undefined);
});

test('default value does not override a defined value', () => {
  const field = createField({ aaa: 222 }).at('aaa', 111);

  expect(field.value).toBe(222);
  expect(field.initialValue).toBe(222);
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

test('calls a listener when value is updated', () => {
  const listenerMock = vi.fn();
  const aaaListenerMock = vi.fn();

  const field = createField({ aaa: 111 });

  field.subscribe(listenerMock);

  field.at('aaa').subscribe(aaaListenerMock);

  field.at('aaa').setValue(222);

  expect(listenerMock).toHaveBeenCalledTimes(2);
  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'valueChanged',
    target: field,
    relatedTarget: field.at('aaa'),
    payload: { aaa: 111 },
  } satisfies FieldEvent);
  expect(listenerMock).toHaveBeenNthCalledWith(2, {
    type: 'valueChanged',
    target: field.at('aaa'),
    relatedTarget: field.at('aaa'),
    payload: 111,
  } satisfies FieldEvent);

  expect(aaaListenerMock).toHaveBeenCalledTimes(1);
  expect(aaaListenerMock).toHaveBeenNthCalledWith(1, {
    type: 'valueChanged',
    target: field.at('aaa'),
    relatedTarget: field.at('aaa'),
    payload: 111,
  } satisfies FieldEvent);
});

test('does not invoke the listener of the unchanged sibling field', () => {
  const aaaListenerMock = vi.fn();
  const bbbListenerMock = vi.fn();

  const field = createField({ aaa: 111, bbb: 'aaa' });

  field.at('aaa').subscribe(aaaListenerMock);
  field.at('bbb').subscribe(bbbListenerMock);

  field.at('aaa').setValue(222);

  expect(bbbListenerMock).not.toHaveBeenCalled();

  expect(aaaListenerMock).toHaveBeenCalledTimes(1);
  expect(aaaListenerMock).toHaveBeenNthCalledWith(1, {
    type: 'valueChanged',
    target: field.at('aaa'),
    relatedTarget: field.at('aaa'),
    payload: 111,
  } satisfies FieldEvent);
});

test('does not invoke the listener of the unchanged child field', () => {
  const aaaListenerMock = vi.fn();
  const bbbListenerMock = vi.fn();

  const field = createField({ aaa: 111, bbb: 'aaa' });

  field.at('aaa').subscribe(aaaListenerMock);
  field.at('bbb').subscribe(bbbListenerMock);

  field.setValue({ aaa: 222, bbb: 'aaa' });

  expect(bbbListenerMock).not.toHaveBeenCalled();
  expect(aaaListenerMock).toHaveBeenCalledTimes(1);
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

test('flushes transient value after it was set to a child field', () => {
  const field = createField({ aaa: 111 });

  field.at('aaa').setTransientValue(222);
  field.at('aaa').flushTransient();

  expect(field.value).toEqual({ aaa: 222 });
  expect(field.isTransient).toBe(false);

  expect(field.at('aaa').value).toBe(222);
  expect(field.at('aaa').isTransient).toBe(false);
});

test('invokes a listener when a value is updated transiently', () => {
  const listenerMock = vi.fn();
  const aaaListenerMock = vi.fn();

  const field = createField({ aaa: 111 });
  field.subscribe(listenerMock);

  field.at('aaa').subscribe(aaaListenerMock);
  field.at('aaa').setTransientValue(222);

  expect(listenerMock).toHaveBeenCalledTimes(1);
  expect(aaaListenerMock).toHaveBeenCalledTimes(1);
});

test('does not leave fields in an inconsistent state if a listener throws an error', () => {
  const aaaListenerMock = vi.fn(() => {
    throw new Error('aaaExpected');
  });
  const bbbListenerMock = vi.fn(() => {
    throw new Error('bbbExpected');
  });

  const field = createField({ aaa: 111, bbb: 222 });

  field.at('aaa').subscribe(aaaListenerMock);
  field.at('bbb').subscribe(bbbListenerMock);

  try {
    field.setValue({ aaa: 333, bbb: 444 });
  } catch {}

  expect(aaaListenerMock).toHaveBeenCalledTimes(1);
  expect(bbbListenerMock).toHaveBeenCalledTimes(1);
  expect(field.at('aaa').value).toBe(333);
  expect(field.at('bbb').value).toBe(444);
});

test('propagates a new value to the child field', () => {
  const listenerMock = vi.fn();
  const aaaListenerMock = vi.fn();

  const field = createField({ aaa: 111 });
  field.subscribe(listenerMock);

  field.at('aaa').subscribe(aaaListenerMock);

  const nextValue = { aaa: 333 };
  field.setValue(nextValue);

  expect(listenerMock).toHaveBeenCalledTimes(2);
  expect(aaaListenerMock).toHaveBeenCalledTimes(1);

  expect(field.value).toBe(nextValue);
  expect(field.isTransient).toBe(false);

  expect(field.at('aaa').value).toBe(333);
  expect(field.at('aaa').isTransient).toBe(false);
});

test('does not propagate a new value to the transient child field', () => {
  const listenerMock = vi.fn();
  const aaaListenerMock = vi.fn();

  const field = createField({ aaa: 111 });
  field.subscribe(listenerMock);

  field.at('aaa').subscribe(aaaListenerMock);
  field.at('aaa').setTransientValue(222);

  field.setValue({ aaa: 333 });

  expect(listenerMock).toHaveBeenCalledTimes(2);
  expect(aaaListenerMock).toHaveBeenCalledTimes(1);

  expect(field.at('aaa').value).toBe(222);
  expect(field.at('aaa').isTransient).toBe(true);
});

test('does not notify listeners if a value of the child field did not change', () => {
  const listenerMock = vi.fn();
  const aaaListenerMock = vi.fn();

  const aaaValue = { bbb: 111 };
  const initialValue = { aaa: aaaValue };

  const field = createField(initialValue);
  field.subscribe(listenerMock);

  field.at('aaa').subscribe(aaaListenerMock);

  field.setValue({ aaa: aaaValue });

  expect(listenerMock).toHaveBeenCalledTimes(1);
  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'valueChanged',
    target: field,
    relatedTarget: field,
    payload: initialValue,
  } satisfies FieldEvent);

  expect(aaaListenerMock).toHaveBeenCalledTimes(0);
});

test('applies a plugin to the root field', () => {
  const pluginMock = vi.fn();

  const field = createField(111, [pluginMock]);

  expect(pluginMock).toHaveBeenCalledTimes(1);
  expect(pluginMock).toHaveBeenNthCalledWith(1, field);
});

test('applies a plugin to the child field', () => {
  const pluginMock = vi.fn();

  const field = createField({ aaa: 111 }, [pluginMock]);

  const aaaField = field.at('aaa');

  expect(pluginMock).toHaveBeenCalledTimes(2);
  expect(pluginMock).toHaveBeenNthCalledWith(1, field);
  expect(pluginMock).toHaveBeenNthCalledWith(2, aaaField);
});

test('an actual parent value is visible in the child field listener', () =>
  new Promise<void>(done => {
    const field = createField({ aaa: 111 });

    field.at('aaa').subscribe(event => {
      expect(event.target.value).toBe(222);
      done();
    });

    field.setValue({ aaa: 222 });
  }));

test('setting field value in a listener does not trigger an infinite loop', () => {
  const field = createField(111);

  const listenerMock = vi.fn(() => {
    field.setValue(333);
  });

  field.subscribe(listenerMock);

  field.setValue(222);

  expect(field.value).toBe(333);
  expect(listenerMock).toHaveBeenCalledTimes(2);
});

test('setting field value in a child field listener does not trigger an infinite loop', () => {
  const field = createField({ aaa: 111 });

  const listenerMock = vi.fn(() => {
    field.at('aaa').setValue(333);
  });

  field.subscribe(listenerMock);

  field.at('aaa').setValue(222);

  expect(field.value.aaa).toBe(333);
  expect(listenerMock).toHaveBeenCalledTimes(4);
});
