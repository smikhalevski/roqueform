import { createField } from 'roqueform';
import { constraintValidationPlugin } from '../main';
import { fireEvent } from '@testing-library/dom';

describe('constraintValidationPlugin', () => {
  let element: HTMLInputElement;

  beforeEach(() => {
    element = document.body.appendChild(document.createElement('input'));
  });

  afterEach(() => {
    element.remove();
  });

  test('enhances the field', () => {
    const field = createField({ foo: 0 }, constraintValidationPlugin());

    expect(field.isInvalid).toBe(false);
    expect(field.error).toBe(null);

    expect(field.at('foo').isInvalid).toBe(false);
    expect(field.at('foo').error).toBe(null);
  });

  test('sets an error to the field that does not have an associated element', () => {
    const field = createField({ foo: 0 }, constraintValidationPlugin());

    const subscriberMock = jest.fn();
    const fooListenerMock = jest.fn();

    field.subscribe(subscriberMock);
    field.at('foo').subscribe(fooListenerMock);

    field.at('foo').setError('aaa');

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBe(null);
    expect(field.at('foo').isInvalid).toBe(true);
    expect(field.at('foo').error).toBe('aaa');

    expect(subscriberMock).toHaveBeenCalledTimes(1);
    expect(fooListenerMock).toHaveBeenCalledTimes(1);
  });

  test('setting an error to the parent field does not affect the child field', () => {
    const field = createField({ foo: 0 }, constraintValidationPlugin());

    const subscriberMock = jest.fn();
    const fooListenerMock = jest.fn();

    field.subscribe(subscriberMock);
    field.at('foo').subscribe(fooListenerMock);

    field.setError('aaa');

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBe('aaa');
    expect(field.at('foo').isInvalid).toBe(false);
    expect(field.at('foo').error).toBe(null);

    expect(subscriberMock).toHaveBeenCalledTimes(1);
    expect(fooListenerMock).toHaveBeenCalledTimes(0);
  });

  test('does not notify the field if the same error is set', () => {
    const field = createField(0, constraintValidationPlugin());

    const subscriberMock = jest.fn();

    field.subscribe(subscriberMock);

    field.setError('aaa');
    field.setError('aaa');

    expect(subscriberMock).toHaveBeenCalledTimes(1);
  });

  test('deletes an error from the field', () => {
    const field = createField(0, constraintValidationPlugin());

    const subscriberMock = jest.fn();

    field.subscribe(subscriberMock);

    field.setError('aaa');
    field.deleteError();

    expect(field.isInvalid).toBe(false);
    expect(field.error).toBe(null);
    expect(subscriberMock).toHaveBeenCalledTimes(2);
  });

  test('clears an error of a derived field', () => {
    const field = createField({ foo: 0 }, constraintValidationPlugin());

    const subscriberMock = jest.fn();
    const fooListenerMock = jest.fn();

    field.subscribe(subscriberMock);
    field.at('foo').subscribe(fooListenerMock);

    field.at('foo').setError('aaa');
    field.clearErrors();

    expect(field.isInvalid).toBe(false);
    expect(field.error).toBe(null);

    expect(field.at('foo').isInvalid).toBe(false);
    expect(field.at('foo').error).toBe(null);
  });

  test('reports validity of the root field', () => {
    const field = createField({ foo: 0 }, constraintValidationPlugin());

    expect(field.reportValidity()).toBe(true);
    expect(field.at('foo').reportValidity()).toBe(true);

    field.setError('aaa');

    expect(field.reportValidity()).toBe(false);
    expect(field.at('foo').reportValidity()).toBe(true);

    field.deleteError();

    expect(field.reportValidity()).toBe(true);
    expect(field.at('foo').reportValidity()).toBe(true);
  });

  test('reports validity of the derived field', () => {
    const field = createField({ foo: 0 }, constraintValidationPlugin());

    field.at('foo').setError('aaa');

    expect(field.reportValidity()).toBe(false);
    expect(field.at('foo').reportValidity()).toBe(false);

    field.at('foo').deleteError();

    expect(field.reportValidity()).toBe(true);
    expect(field.at('foo').reportValidity()).toBe(true);
  });

  test('uses a validationMessage as an error', () => {
    const field = createField({ foo: 0 }, constraintValidationPlugin());

    element.required = true;

    field.at('foo').ref(element);

    expect(field.isInvalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').isInvalid).toBe(true);
    expect(field.at('foo').error).toEqual('Constraints not satisfied');
  });

  test('deletes an error when a ref is changed', () => {
    const field = createField(0, constraintValidationPlugin());

    const subscriberMock = jest.fn();

    field.subscribe(subscriberMock);

    element.required = true;

    field.ref(element);

    expect(field.isInvalid).toBe(true);
    expect(field.error).toEqual('Constraints not satisfied');
    expect(subscriberMock).toHaveBeenCalledTimes(1);

    field.ref(null);

    expect(field.isInvalid).toBe(false);
    expect(field.error).toBe(null);
    expect(subscriberMock).toHaveBeenCalledTimes(2);
  });

  test('notifies the field when the value is changed', () => {
    const field = createField({ foo: 0 }, constraintValidationPlugin());

    const subscriberMock = jest.fn();
    const fooListenerMock = jest.fn();

    field.subscribe(subscriberMock);
    field.at('foo').subscribe(fooListenerMock);

    element.value = 'aaa';
    element.required = true;

    expect(element.validationMessage).toBe('');
    expect(subscriberMock).not.toHaveBeenCalled();

    field.at('foo').ref(element);

    expect(subscriberMock).toHaveBeenCalledTimes(0);
    expect(field.at('foo').isInvalid).toBe(false);

    fireEvent.change(element, { target: { value: '' } });

    expect(subscriberMock).toHaveBeenCalledTimes(1);
    expect(fooListenerMock).toHaveBeenCalledTimes(1);
  });

  test('does not notify an already invalid parent', () => {
    const field = createField({ foo: 0 }, constraintValidationPlugin());

    const subscriberMock = jest.fn();
    const fooListenerMock = jest.fn();

    field.subscribe(subscriberMock);
    field.at('foo').subscribe(fooListenerMock);

    element.value = 'aaa';
    element.required = true;

    expect(element.validationMessage).toBe('');
    expect(subscriberMock).not.toHaveBeenCalled();

    field.at('foo').ref(element);

    expect(subscriberMock).toHaveBeenCalledTimes(0);
    expect(field.at('foo').isInvalid).toBe(false);

    fireEvent.change(element, { target: { value: '' } });

    expect(subscriberMock).toHaveBeenCalledTimes(1);
    expect(fooListenerMock).toHaveBeenCalledTimes(1);
  });
});
