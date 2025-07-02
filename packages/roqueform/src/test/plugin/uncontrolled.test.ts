/**
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { fireEvent } from '@testing-library/dom';
import { createField, FieldPlugin } from '../../main/index.js';
import uncontrolledPlugin, { ElementsValueAccessor, UncontrolledMixin } from '../../main/plugin/uncontrolled.js';

let element: HTMLInputElement;

beforeEach(() => {
  element = document.body.appendChild(document.createElement('input'));
});

afterEach(() => {
  element.remove();
});

test('invokes ref from the preceding plugin', () => {
  const refMock = vi.fn();
  const pluginMock: FieldPlugin<any, { ref: UncontrolledMixin['ref'] }> = vi.fn(field => {
    field.ref = refMock;
  });

  const field = createField({ aaa: 111 }, [pluginMock, uncontrolledPlugin()]);

  expect(pluginMock).toHaveBeenCalledTimes(1);
  expect(pluginMock).toHaveBeenNthCalledWith(1, field);

  expect(refMock).not.toHaveBeenCalled();

  field.at('aaa').ref(element);

  expect(refMock).toHaveBeenCalledTimes(1);
  expect(refMock).toHaveBeenNthCalledWith(1, element);
});

// test('ref can be called with multiple elements', () => {
//   const field = createField(111, [uncontrolledPlugin()]);
//
//   const element1 = document.createElement('input');
//   const element2 = document.createElement('textarea');
//
//   field.ref(element);
//   field.ref(element1);
//   field.ref(element2);
//
//   expect(field.ref.current).toBe(element);
//   expect(field.ref.toArray()).toEqual([element, element1, element2]);
// });

// test('ref and refFor can be called with the same element', () => {
//   const field = createField(111, [uncontrolledPlugin()]);
//
//   field.ref(element);
//   field.ref.at(1)(element);
//
//   expect(field.ref.current).toBe(element);
//   expect(field.ref.toArray()).toEqual([element]);
// });
//
// test('refFor can be called with the same element for different keys', () => {
//   const field = createField(111, [uncontrolledPlugin()]);
//
//   field.ref.at(1)(element);
//   field.ref.at(2)(element);
//
//   expect(field.ref.current).toBeNull();
//   expect(field.ref.toArray()).toEqual([element]);
// });
//
// test('ref removes an element when called with null', () => {
//   const field = createField(111, [uncontrolledPlugin()]);
//
//   const element1 = document.createElement('input');
//   const element2 = document.createElement('textarea');
//
//   field.ref(element);
//   field.ref.at(1)(element1);
//   field.ref.at(2)(element2);
//
//   field.ref(null);
//
//   expect(field.ref.toArray()).toEqual([element1, element2]);
// });
//
// test('refFor removes an element when called with null', () => {
//   const field = createField(111, [uncontrolledPlugin()]);
//
//   const element1 = document.createElement('input');
//   const element2 = document.createElement('textarea');
//
//   field.ref.at(1)(element1);
//   field.ref.at(2)(element2);
//
//   field.ref.at(1)(null);
//
//   expect(field.ref.toArray()).toEqual([element2]);
//
//   field.ref.at(2)(null);
//
//   expect(field.ref.toArray()).toEqual([]);
// });

test('removed element does not update the field', () => {
  const field = createField(111, [uncontrolledPlugin()]);
  const setValueSpy = vi.spyOn(field, 'setValue');

  field.ref(element);

  element.remove();

  field.ref(null);

  fireEvent.input(element, { target: { value: '222' } });

  expect(setValueSpy).not.toHaveBeenCalled();
  expect(field.value).toBe(111);
});

test('updates field value when input value changes', () => {
  const listenerMock = vi.fn();
  const field = createField({ aaa: 111 }, [uncontrolledPlugin()]);

  element.type = 'number';

  field.subscribe(listenerMock);
  field.at('aaa').ref(element);

  fireEvent.input(element, { target: { value: '222' } });

  expect(listenerMock).toHaveBeenCalledTimes(2);
  expect(field.value).toEqual({ aaa: 222 });
});

test('updates input value when field value changes', () => {
  const field = createField({ aaa: 111 }, [uncontrolledPlugin()]);

  field.at('aaa').ref(element);
  field.at('aaa').setValue(222);

  expect(element.value).toBe('222');
});

test('sets the initial value to the element', () => {
  const field = createField({ aaa: 111 }, [uncontrolledPlugin()]);

  element.type = 'number';

  field.at('aaa').ref(element);

  expect(element.value).toBe('111');
});

test('input element uses input event', () => {
  const field = createField('aaa', [uncontrolledPlugin()]);
  const setValueSpy = vi.spyOn(field, 'setValue');

  field.ref(element);

  fireEvent.input(element, { target: { value: 'bbb' } });

  expect(setValueSpy).toHaveBeenCalledTimes(1);

  fireEvent.change(element, { target: { value: 'ccc' } });

  expect(setValueSpy).toHaveBeenCalledTimes(1);
});

test('textarea element uses input event', () => {
  const field = createField('aaa', [uncontrolledPlugin()]);
  const setValueSpy = vi.spyOn(field, 'setValue');
  const element = document.body.appendChild(document.createElement('textarea'));

  field.ref(element);

  fireEvent.input(element, { target: { value: 'bbb' } });

  expect(setValueSpy).toHaveBeenCalledTimes(1);

  fireEvent.change(element, { target: { value: 'ccc' } });

  expect(setValueSpy).toHaveBeenCalledTimes(1);
});

test('select element uses input event', () => {
  const field = createField('aaa', [uncontrolledPlugin()]);
  const setValueSpy = vi.spyOn(field, 'setValue');
  const element = document.body.appendChild(document.createElement('select'));

  field.ref(element);

  fireEvent.input(element, { target: { value: 'bbb' } });

  expect(setValueSpy).toHaveBeenCalledTimes(1);

  fireEvent.change(element, { target: { value: 'ccc' } });

  expect(setValueSpy).toHaveBeenCalledTimes(1);
});

test('uses accessor to set values to the element', () => {
  const accessorMock: ElementsValueAccessor = {
    get: () => undefined,
    set: vi.fn(),
  };

  const field = createField({ aaa: 111 }, [uncontrolledPlugin(accessorMock)]);

  field.at('aaa').ref(element);

  expect(accessorMock.set).toHaveBeenCalledTimes(1);
  expect(accessorMock.set).toHaveBeenNthCalledWith(1, [element], 111);

  field.at('aaa').setValue(222);

  expect(accessorMock.set).toHaveBeenCalledTimes(2);
  expect(accessorMock.set).toHaveBeenNthCalledWith(2, [element], 222);
});

test('does not call set accessor if there are no referenced elements', () => {
  const accessorMock: ElementsValueAccessor = {
    get: () => undefined,
    set: vi.fn(),
  };

  const field = createField({ aaa: 111 }, [uncontrolledPlugin(accessorMock)]);

  field.at('aaa').setValue(222);

  expect(accessorMock.set).not.toHaveBeenCalled();
});

test('multiple elements are passed to set accessor', () => {
  const accessorMock: ElementsValueAccessor = {
    get: () => 'xxx',
    set: vi.fn(),
  };

  const element1 = document.createElement('input');
  const element2 = document.createElement('textarea');

  const field = createField({ aaa: 111 }, [uncontrolledPlugin(accessorMock)]);

  field.at('aaa').ref(element1);

  expect(accessorMock.set).toHaveBeenCalledTimes(1);
  expect(accessorMock.set).toHaveBeenNthCalledWith(1, [element1], 111);

  field.at('aaa').ref(element2);

  expect(accessorMock.set).toHaveBeenCalledTimes(2);
  expect(accessorMock.set).toHaveBeenNthCalledWith(2, [element1, element2], 111);
});
