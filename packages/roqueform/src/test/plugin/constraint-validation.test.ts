/**
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { fireEvent } from '@testing-library/dom';
import { createField, FieldEvent } from '../../main/index.js';
import constraintValidationPlugin from '../../main/plugin/constraint-validation.js';

vi.useFakeTimers();

let element: HTMLInputElement;

beforeEach(() => {
  element = document.body.appendChild(document.createElement('input'));
  element.required = true;
  element.value = 'test';
});

afterEach(() => {
  vi.clearAllTimers();
  element.remove();
});

test('enhances the field', () => {
  const field = createField({ aaa: 111 }, [constraintValidationPlugin()]);

  expect(field.isInvalid).toBe(false);
  expect(field.validity).toEqual({
    badInput: false,
    customError: false,
    patternMismatch: false,
    rangeOverflow: false,
    rangeUnderflow: false,
    stepMismatch: false,
    tooLong: false,
    tooShort: false,
    typeMismatch: false,
    valid: false,
    valueMissing: false,
  });

  expect(field.at('aaa').isInvalid).toBe(false);
  expect(field.at('aaa').validity).toEqual({
    badInput: false,
    customError: false,
    patternMismatch: false,
    rangeOverflow: false,
    rangeUnderflow: false,
    stepMismatch: false,
    tooLong: false,
    tooShort: false,
    typeMismatch: false,
    valid: false,
    valueMissing: false,
  });
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

  const listenerMock = vi.fn();

  field.subscribe(listenerMock);

  element.value = '';

  field.ref(element);

  expect(field.isInvalid).toBe(false);
  expect(listenerMock).toHaveBeenCalledTimes(1);
  expect(listenerMock).toHaveBeenNthCalledWith(1, {
    type: 'validityChanged',
    target: field,
    relatedTarget: null,
    payload: {
      badInput: false,
      customError: false,
      patternMismatch: false,
      rangeOverflow: false,
      rangeUnderflow: false,
      stepMismatch: false,
      tooLong: false,
      tooShort: false,
      typeMismatch: false,
      valid: false,
      valueMissing: false,
    },
  } satisfies FieldEvent);
});

test('notifies the field when the value is changed', () => {
  const field = createField({ aaa: 111 }, [constraintValidationPlugin()]);

  const listenerMock = vi.fn();
  const aaaListenerMock = vi.fn();

  field.subscribe(listenerMock);
  field.at('aaa').subscribe(aaaListenerMock);

  expect(element.validationMessage).toBe('');
  expect(listenerMock).not.toHaveBeenCalled();

  field.at('aaa').ref(element);

  expect(listenerMock).toHaveBeenCalledTimes(1);
  expect(field.at('aaa').isInvalid).toBe(true);

  fireEvent.change(element, { target: { value: '' } });

  expect(listenerMock).toHaveBeenCalledTimes(1);
  expect(aaaListenerMock).toHaveBeenCalledTimes(1);
});
