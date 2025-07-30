import { expect, test, vi } from 'vitest';
import { createField } from '../../main/index.js';
import errorsPlugin from '../../main/plugin/errors.js';

test('enhances the field', () => {
  const field = createField({ aaa: 111 }, [errorsPlugin()]);

  expect(field.errors.length).toBe(0);
  expect(field.isInvalid).toBe(false);

  expect(field.at('aaa').isInvalid).toBe(false);
  expect(field.at('aaa').errors.length).toBe(0);
});

test('adds an error to the root field', () => {
  const field = createField({ aaa: 111 }, [errorsPlugin()]);

  const listenerMock = vi.fn();
  const aaaListenerMock = vi.fn();

  const errors = field.errors;

  field.subscribe(listenerMock);
  field.at('aaa').subscribe(aaaListenerMock);

  field.addError(222);

  expect(field.isInvalid).toBe(true);
  expect(field.errors).toEqual([222]);
  expect(field.errors).not.toBe(errors);

  expect(field.at('aaa').isInvalid).toBe(false);
  expect(field.at('aaa').errors.length).toBe(0);

  expect(listenerMock).toHaveBeenCalledTimes(1);
  expect(aaaListenerMock).not.toHaveBeenCalled();
});

test('adds an error to the child field', () => {
  const field = createField({ aaa: 111 }, [errorsPlugin()]);

  const listenerMock = vi.fn();
  const aaaListenerMock = vi.fn();

  field.subscribe(listenerMock);
  field.at('aaa').subscribe(aaaListenerMock);

  field.at('aaa').addError(222);

  expect(field.isInvalid).toBe(false);
  expect(field.errors.length).toBe(0);

  expect(field.at('aaa').isInvalid).toBe(true);
  expect(field.at('aaa').errors).toEqual([222]);

  expect(listenerMock).toHaveBeenCalledTimes(1);
  expect(aaaListenerMock).toHaveBeenCalledTimes(1);
});

test('does not add duplicated error by default', () => {
  const field = createField({ aaa: 111 }, [errorsPlugin()]);

  const listenerMock = vi.fn();
  const aaaListenerMock = vi.fn();

  field.subscribe(listenerMock);
  field.at('aaa').subscribe(aaaListenerMock);

  field.addError(222);
  field.addError(222);

  expect(field.isInvalid).toBe(true);
  expect(field.errors).toEqual([222]);

  expect(field.at('aaa').isInvalid).toBe(false);
  expect(field.at('aaa').errors.length).toBe(0);

  expect(listenerMock).toHaveBeenCalledTimes(1);
  expect(aaaListenerMock).not.toHaveBeenCalled();
});

test('uses concatErrors to add a new error', () => {
  const errors = [333];
  const concatErrorsMock = vi.fn(() => errors);

  const field = createField({ aaa: 111 }, [errorsPlugin(concatErrorsMock)]);

  field.addError(222);

  expect(field.errors).toEqual(errors);
  expect(concatErrorsMock).toHaveBeenCalledTimes(1);
  expect(concatErrorsMock).toHaveBeenNthCalledWith(1, [], 222);
});

test('adds an error when errorDetected event is published', () => {
  const field = createField({ aaa: 111 }, [errorsPlugin()]);

  field.at('aaa').publish({
    type: 'errorDetected',
    target: field.at('aaa'),
    relatedTarget: null,
    payload: 222,
  });

  expect(field.isInvalid).toBe(false);
  expect(field.errors).toEqual([]);
  expect(field.at('aaa').isInvalid).toBe(true);
  expect(field.at('aaa').errors).toEqual([222]);
});

test('deletes an error from the root field', () => {
  const field = createField({ aaa: 111 }, [errorsPlugin()]);

  const listenerMock = vi.fn();
  const aaaListenerMock = vi.fn();

  field.subscribe(listenerMock);
  field.at('aaa').subscribe(aaaListenerMock);

  field.addError(222);
  field.deleteError(222);

  expect(field.isInvalid).toBe(false);
  expect(field.errors.length).toBe(0);

  expect(field.at('aaa').isInvalid).toBe(false);
  expect(field.at('aaa').errors.length).toBe(0);

  expect(listenerMock).toHaveBeenCalledTimes(2);
  expect(aaaListenerMock).not.toHaveBeenCalled();
});

test('deletes an error from the child field', () => {
  const field = createField({ aaa: 111 }, [errorsPlugin()]);

  const listenerMock = vi.fn();
  const aaaListenerMock = vi.fn();

  field.subscribe(listenerMock);
  field.at('aaa').subscribe(aaaListenerMock);

  field.at('aaa').addError(222);
  field.at('aaa').deleteError(222);

  expect(field.isInvalid).toBe(false);
  expect(field.errors.length).toBe(0);

  expect(field.at('aaa').isInvalid).toBe(false);
  expect(field.at('aaa').errors.length).toBe(0);

  expect(listenerMock).toHaveBeenCalledTimes(2);
  expect(aaaListenerMock).toHaveBeenCalledTimes(2);
});

test('deletes an error from the child field but parent remains invalid', () => {
  const field = createField({ aaa: 111, bbb: 222 }, [errorsPlugin()]);

  const listenerMock = vi.fn();
  const aaaListenerMock = vi.fn();
  const bbbListenerMock = vi.fn();

  field.subscribe(listenerMock);
  field.at('aaa').subscribe(aaaListenerMock);
  field.at('bbb').subscribe(bbbListenerMock);

  field.at('aaa').addError(333);
  field.at('bbb').addError(444);

  field.at('bbb').deleteError(444);

  expect(field.isInvalid).toBe(false);
  expect(field.errors.length).toBe(0);

  expect(field.at('aaa').isInvalid).toBe(true);
  expect(field.at('aaa').errors).toEqual([333]);

  expect(field.at('bbb').isInvalid).toBe(false);
  expect(field.at('bbb').errors.length).toBe(0);

  expect(listenerMock).toHaveBeenCalledTimes(3);
  expect(aaaListenerMock).toHaveBeenCalledTimes(1);
  expect(bbbListenerMock).toHaveBeenCalledTimes(2);
});

test('clears errors recursively', () => {
  const field = createField({ aaa: 111, bbb: 222 }, [errorsPlugin()]);

  const listenerMock = vi.fn();
  const aaaListenerMock = vi.fn();
  const bbbListenerMock = vi.fn();

  field.subscribe(listenerMock);
  field.at('aaa').subscribe(aaaListenerMock);
  field.at('bbb').subscribe(bbbListenerMock);

  field.at('aaa').addError(333);
  field.at('bbb').addError(444);

  field.clearErrors({ isRecursive: true });

  expect(field.isInvalid).toBe(false);
  expect(field.errors.length).toBe(0);

  expect(field.at('aaa').isInvalid).toBe(false);
  expect(field.at('aaa').errors.length).toBe(0);

  expect(field.at('bbb').isInvalid).toBe(false);
  expect(field.at('bbb').errors.length).toBe(0);

  expect(listenerMock).toHaveBeenCalledTimes(4);
  expect(aaaListenerMock).toHaveBeenCalledTimes(2);
  expect(bbbListenerMock).toHaveBeenCalledTimes(2);
});

test('clears errors from nested fields', () => {
  const field = createField(
    {
      aaa: {
        bbb: {
          ccc: 111,
          ddd: 222,
        },
      },
    },
    [errorsPlugin()]
  );

  field.at('aaa').at('bbb').at('ccc').addError(333);
  field.at('aaa').at('bbb').at('ddd').addError(444);

  field.clearErrors({ isRecursive: true });

  expect(field.isInvalid).toBe(false);
  expect(field.errors.length).toBe(0);

  expect(field.at('aaa').isInvalid).toBe(false);
  expect(field.at('aaa').at('bbb').isInvalid).toBe(false);
  expect(field.at('aaa').at('bbb').at('ccc').isInvalid).toBe(false);
  expect(field.at('aaa').at('bbb').at('ddd').isInvalid).toBe(false);
});
