import { createField } from 'roqueform';
import { constraintValidationPlugin } from '../main';
import { fireEvent } from '@testing-library/dom';

jest.useFakeTimers();

describe('constraintValidationPlugin', () => {
  let element: HTMLInputElement;

  beforeEach(() => {
    element = document.body.appendChild(document.createElement('input'));
  });

  afterEach(() => {
    jest.clearAllTimers();
    element.remove();
  });

  test('enhances the field', () => {
    const field = createField({ aaa: 111 }, constraintValidationPlugin());

    expect(field.element).toBeNull();
    expect(field.isInvalid).toBe(false);
    expect(field.validity).toBeNull();

    expect(field.at('aaa').element).toBeNull();
    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').validity).toBeNull();
  });

  test('sets an error to the field that does not have an associated element', () => {
    const field = createField({ aaa: 111 }, constraintValidationPlugin());

    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();

    field.on('change:errors', subscriberMock);
    field.at('aaa').on('change:errors', aaaSubscriberMock);

    field.at('aaa').setError('222');

    expect(field.isInvalid).toBe(true);
    expect(field.errors).toBeNull();
    expect(field.errorCount).toBe(1);
    expect(field.errorOrigin).toBe(0);
    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').errors).toBe('222');
    expect(field.at('aaa').errorCount).toBe(1);
    expect(field.at('aaa').errorOrigin).toBe(2);

    expect(subscriberMock).toHaveBeenCalledTimes(1);
    expect(aaaSubscriberMock).toHaveBeenCalledTimes(1);
  });

  test('setting an error to the parent field does not affect the child field', () => {
    const field = createField({ aaa: 111 }, constraintValidationPlugin());

    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();

    field.on('change:errors', subscriberMock);
    field.at('aaa').on('change:errors', aaaSubscriberMock);

    field.setError('222');

    expect(field.isInvalid).toBe(true);
    expect(field.errors).toBe('222');
    expect(field.errorCount).toBe(1);
    expect(field.errorOrigin).toBe(2);
    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').errors).toBeNull();
    expect(field.at('aaa').errorCount).toBe(0);
    expect(field.at('aaa').errorOrigin).toBe(0);

    expect(subscriberMock).toHaveBeenCalledTimes(1);
    expect(aaaSubscriberMock).toHaveBeenCalledTimes(0);
  });

  test('does not notify the field if the same error is set', () => {
    const field = createField(111, constraintValidationPlugin());

    const subscriberMock = jest.fn();

    field.on('*', subscriberMock);

    field.setError('xxx');
    field.setError('xxx');

    expect(subscriberMock).toHaveBeenCalledTimes(1);
  });

  test('deletes an error from the field', () => {
    const field = createField(111, constraintValidationPlugin());

    const subscriberMock = jest.fn();

    field.on('*', subscriberMock);

    field.setError('xxx');
    field.deleteError();

    expect(field.isInvalid).toBe(false);
    expect(field.errors).toBeNull();
    expect(field.errorCount).toBe(0);
    expect(field.errorOrigin).toBe(0);
    expect(subscriberMock).toHaveBeenCalledTimes(2);
  });

  test('restores the constraint error on delete', () => {
    const field = createField(111, constraintValidationPlugin());

    element.required = true;

    field.ref(element);

    expect(field.errors).toEqual('Constraints not satisfied');

    field.setError('xxx');

    expect(field.errors).toEqual('xxx');

    field.deleteError();

    expect(field.errors).toEqual('Constraints not satisfied');
  });

  test('clears an error of a child field', () => {
    const field = createField({ aaa: 111 }, constraintValidationPlugin());

    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();

    field.on('*', subscriberMock);
    field.at('aaa').on('*', aaaSubscriberMock);

    field.at('aaa').setError('aaa');
    field.clearErrors();

    expect(field.isInvalid).toBe(false);
    expect(field.errors).toBeNull();

    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').errors).toBeNull();
  });

  test('reports validity of the root field', () => {
    const field = createField({ aaa: 111 }, constraintValidationPlugin());

    expect(field.reportValidity()).toBe(true);
    expect(field.at('aaa').reportValidity()).toBe(true);

    field.setError('xxx');

    expect(field.reportValidity()).toBe(false);
    expect(field.at('aaa').reportValidity()).toBe(true);

    field.deleteError();

    expect(field.reportValidity()).toBe(true);
    expect(field.at('aaa').reportValidity()).toBe(true);
  });

  test('reports validity of the child field', () => {
    const field = createField({ aaa: 111 }, constraintValidationPlugin());

    field.at('aaa').setError('xxx');

    expect(field.reportValidity()).toBe(false);
    expect(field.at('aaa').reportValidity()).toBe(false);

    field.at('aaa').deleteError();

    expect(field.reportValidity()).toBe(true);
    expect(field.at('aaa').reportValidity()).toBe(true);
  });

  test('uses a validationMessage as an error', () => {
    const field = createField({ aaa: 111 }, constraintValidationPlugin());

    element.required = true;

    field.at('aaa').ref(element);

    expect(field.isInvalid).toBe(true);
    expect(field.errors).toBeNull();

    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').errors).toEqual('Constraints not satisfied');
  });

  test('deletes an error when a ref is changed', () => {
    const field = createField(111, constraintValidationPlugin());

    const subscriberMock = jest.fn();

    field.on('*', subscriberMock);

    element.required = true;

    field.ref(element);

    jest.runAllTimers();

    expect(field.isInvalid).toBe(true);
    expect(field.errors).toEqual('Constraints not satisfied');
    expect(subscriberMock).toHaveBeenCalledTimes(1);

    field.ref(null);

    jest.runAllTimers();

    expect(field.isInvalid).toBe(false);
    expect(field.errors).toBeNull();
    expect(subscriberMock).toHaveBeenCalledTimes(2);
  });

  test('notifies the field when the value is changed', () => {
    const field = createField({ aaa: 111 }, constraintValidationPlugin());

    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();

    field.on('change:errors', subscriberMock);
    field.at('aaa').on('change:errors', aaaSubscriberMock);

    element.value = 'aaa';
    element.required = true;

    expect(element.validationMessage).toBe('');
    expect(subscriberMock).not.toHaveBeenCalled();

    field.at('aaa').ref(element);

    jest.runAllTimers();

    expect(subscriberMock).toHaveBeenCalledTimes(0);
    expect(field.at('aaa').isInvalid).toBe(false);

    fireEvent.change(element, { target: { value: '' } });

    expect(subscriberMock).toHaveBeenCalledTimes(1);
    expect(aaaSubscriberMock).toHaveBeenCalledTimes(1);
  });
});
