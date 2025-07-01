import { expect, test, vi } from 'vitest';
import { createField } from '../../main/index.js';
import { annotationsPlugin } from '../../main/plugin/annotations.js';

test('annotations are an empty object by default', () => {
  const field = createField({ aaa: 111 }, [annotationsPlugin({})]);

  expect(field.annotations).toEqual({});
  expect(field.at('aaa').annotations).toEqual({});
});

test('populates annotations with defaults', () => {
  const initialValue = { aaa: 111 };

  const field = createField(initialValue, [annotationsPlugin({ xxx: 222 })]);

  expect(field.annotations.xxx).toBe(222);
  expect(field.at('aaa').annotations.xxx).toBe(222);
});

// test('patches root field annotations', () => {
//   const listenerMock = vi.fn();
//   const aaaListenerMock = vi.fn();
//
//   const field = createField({ aaa: 111 }, [annotationsPlugin({ createObservableRefCollection: 222 })]);
//
//   field.subscribe(listenerMock);
//   field.at('aaa').subscribe(aaaListenerMock);
//
//   field.annotate({ createObservableRefCollection: 333 });
//
//   expect(field.annotations.createObservableRefCollection).toBe(333);
//   expect(field.at('aaa').annotations.createObservableRefCollection).toBe(222);
//
//   expect(listenerMock).toHaveBeenCalledTimes(1);
//   expect(listenerMock).toHaveBeenNthCalledWith(1, {
//     type: 'annotationsChanged',
//     target: field,
//     relatedTarget: field,
//     payload: { createObservableRefCollection: 222 },
//   });
//   expect(aaaListenerMock).not.toHaveBeenCalled();
// });

test('patches root field annotations with callback', () => {
  const patchMock = vi.fn(() => ({ xxx: 333 }));
  const listenerMock = vi.fn();

  const field = createField(111, [annotationsPlugin({ xxx: 222 })]);

  field.subscribe(listenerMock);

  field.annotate(patchMock);

  expect(field.annotations.xxx).toBe(333);

  expect(patchMock).toHaveBeenCalledTimes(1);
  expect(patchMock).toHaveBeenNthCalledWith(1, field);
});

// test('patches child field annotations', () => {
//   const listenerMock = vi.fn();
//   const aaaListenerMock = vi.fn();
//
//   const field = createField({ aaa: 111 }, [annotationsPlugin({ createObservableRefCollection: 222 })]);
//
//   field.subscribe(listenerMock);
//   field.at('aaa').subscribe(aaaListenerMock);
//
//   field.at('aaa').annotate({ createObservableRefCollection: 333 });
//
//   expect(field.annotations.createObservableRefCollection).toBe(222);
//   expect(field.at('aaa').annotations.createObservableRefCollection).toBe(333);
//
//   expect(listenerMock).toHaveBeenCalledTimes(1);
//   expect(listenerMock).toHaveBeenNthCalledWith(1, {
//     type: 'annotationsChanged',
//     target: field.at('aaa'),
//     relatedTarget: field.at('aaa'),
//     payload: { createObservableRefCollection: 222 },
//   });
//   expect(aaaListenerMock).toHaveBeenCalledTimes(1);
//   expect(aaaListenerMock).toHaveBeenNthCalledWith(1, {
//     type: 'annotationsChanged',
//     target: field.at('aaa'),
//     relatedTarget: field.at('aaa'),
//     payload: { createObservableRefCollection: 222 },
//   });
// });

test('uses patcher to apply patches', () => {
  const applyPatchMock = vi.fn((a, b) => Object.assign({}, a, b));

  const field = createField(111, [annotationsPlugin({}, applyPatchMock)]);

  field.annotate({ xxx: 222 });

  expect(applyPatchMock).toHaveBeenCalledTimes(1);
  expect(applyPatchMock).toHaveBeenNthCalledWith(1, {}, { xxx: 222 });
});
