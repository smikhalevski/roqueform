import { fireEvent } from '@testing-library/dom';
import { createField } from '../../main';
import { constraintValidationPlugin } from '../../main/plugin/constraint-validation';

jest.useFakeTimers();

let element: HTMLInputElement;

beforeEach(() => {
  element = document.body.appendChild(document.createElement('input'));
  element.required = true;
  element.value = 'test';
});

afterEach(() => {
  jest.clearAllTimers();
  element.remove();
});

test('enhances the field', () => {
  const field = createField({ aaa: 111 }, [constraintValidationPlugin()]);

  expect(field.validatedElement).toBeNull();
  expect(field.isInvalid).toBe(false);
  expect(field.validity).toBeNull();

  expect(field.at('aaa').validatedElement).toBeNull();
  expect(field.at('aaa').isInvalid).toBe(false);
  expect(field.at('aaa').validity).toBeNull();
});

test('reports validity of the root field', () => {
  const field = createField({ aaa: 111 }, [constraintValidationPlugin()]);

  field.ref(element);

  expect(field.reportValidity()).toBe(true);
  expect(field.at('aaa').reportValidity()).toBe(true);

  element.value = '';

  expect(field.reportValidity()).toBe(false);
  expect(field.at('aaa').reportValidity()).toBe(true);
});

test('reports validity of the child field', () => {
  const field = createField({ aaa: 111 }, [constraintValidationPlugin()]);

  field.at('aaa').ref(element);

  element.value = '';

  expect(field.reportValidity()).toBe(false);
  expect(field.at('aaa').reportValidity()).toBe(false);

  element.value = 'test';

  expect(field.reportValidity()).toBe(true);
  expect(field.at('aaa').reportValidity()).toBe(true);
});

test('deletes an error when a ref is changed', () => {
  const field = createField(111, [constraintValidationPlugin()]);

  const listenerMock = jest.fn();

  field.subscribe(listenerMock);

  element.value = '';

  field.ref(element);

  jest.runAllTimers();

  expect(field.isInvalid).toBe(true);
  expect(listenerMock).toHaveBeenCalledTimes(1);

  field.ref(null);

  jest.runAllTimers();

  expect(field.isInvalid).toBe(false);
  expect(listenerMock).toHaveBeenCalledTimes(2);
});

test('notifies the field when the value is changed', () => {
  const field = createField({ aaa: 111 }, [constraintValidationPlugin()]);

  const listenerMock = jest.fn();
  const aaaListenerMock = jest.fn();

  field.subscribe(listenerMock);
  field.at('aaa').subscribe(aaaListenerMock);

  expect(element.validationMessage).toBe('');
  expect(listenerMock).not.toHaveBeenCalled();

  field.at('aaa').ref(element);

  jest.runAllTimers();

  expect(listenerMock).toHaveBeenCalledTimes(1);
  expect(field.at('aaa').isInvalid).toBe(false);

  fireEvent.change(element, { target: { value: '' } });

  expect(listenerMock).toHaveBeenCalledTimes(2);
  expect(aaaListenerMock).toHaveBeenCalledTimes(2);
});
