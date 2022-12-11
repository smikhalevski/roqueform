import { createField, objectAccessor } from 'roqueform';
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
    const field = createField(objectAccessor, { foo: 0 }, constraintValidationPlugin());

    expect(field.invalid).toBe(false);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(false);
    expect(field.at('foo').error).toBe(null);
  });

  test('sets an error to the field that does not have an associated element', () => {
    const field = createField(objectAccessor, { foo: 0 }, constraintValidationPlugin());

    const listenerMock = jest.fn();
    const fooListenerMock = jest.fn();

    field.subscribe(listenerMock);
    field.at('foo').subscribe(fooListenerMock);

    field.at('foo').setError('aaa');

    expect(field.invalid).toBe(true);
    expect(field.error).toBe(null);
    expect(field.at('foo').invalid).toBe(true);
    expect(field.at('foo').error).toBe('aaa');

    expect(listenerMock).toHaveBeenCalledTimes(1);
    expect(fooListenerMock).toHaveBeenCalledTimes(1);
  });

  test('setting an error to the parent field does not affect the child field', () => {
    const field = createField(objectAccessor, { foo: 0 }, constraintValidationPlugin());

    const listenerMock = jest.fn();
    const fooListenerMock = jest.fn();

    field.subscribe(listenerMock);
    field.at('foo').subscribe(fooListenerMock);

    field.setError('aaa');

    expect(field.invalid).toBe(true);
    expect(field.error).toBe('aaa');
    expect(field.at('foo').invalid).toBe(false);
    expect(field.at('foo').error).toBe(null);

    expect(listenerMock).toHaveBeenCalledTimes(1);
    expect(fooListenerMock).toHaveBeenCalledTimes(0);
  });

  test('does not notify the field if the same error is set', () => {
    const field = createField(objectAccessor, 0, constraintValidationPlugin());

    const listenerMock = jest.fn();

    field.subscribe(listenerMock);

    field.setError('aaa');
    field.setError('aaa');

    expect(listenerMock).toHaveBeenCalledTimes(1);
  });

  test('deletes an error from the field', () => {
    const field = createField(objectAccessor, 0, constraintValidationPlugin());

    const listenerMock = jest.fn();

    field.subscribe(listenerMock);

    field.setError('aaa');
    field.deleteError();

    expect(field.invalid).toBe(false);
    expect(field.error).toBe(null);
    expect(listenerMock).toHaveBeenCalledTimes(2);
  });

  test('clears an error of a derived field', () => {
    const field = createField(objectAccessor, { foo: 0 }, constraintValidationPlugin());

    const listenerMock = jest.fn();
    const fooListenerMock = jest.fn();

    field.subscribe(listenerMock);
    field.at('foo').subscribe(fooListenerMock);

    field.at('foo').setError('aaa');
    field.clearErrors();

    expect(field.invalid).toBe(false);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(false);
    expect(field.at('foo').error).toBe(null);
  });

  test('reports validity of the root field', () => {
    const field = createField(objectAccessor, { foo: 0 }, constraintValidationPlugin());

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
    const field = createField(objectAccessor, { foo: 0 }, constraintValidationPlugin());

    field.at('foo').setError('aaa');

    expect(field.reportValidity()).toBe(false);
    expect(field.at('foo').reportValidity()).toBe(false);

    field.at('foo').deleteError();

    expect(field.reportValidity()).toBe(true);
    expect(field.at('foo').reportValidity()).toBe(true);
  });

  test('uses a validationMessage as an error', () => {
    const field = createField(objectAccessor, { foo: 0 }, constraintValidationPlugin());

    element.required = true;

    field.at('foo').refCallback(element);

    expect(field.at('foo').ref.current).toBe(element);

    expect(field.invalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(true);
    expect(field.at('foo').error).toEqual('Constraints not satisfied');
  });

  test('deletes an error when a ref is changed', () => {
    const field = createField(objectAccessor, 0, constraintValidationPlugin());

    const listenerMock = jest.fn();

    field.subscribe(listenerMock);

    element.required = true;

    field.refCallback(element);

    expect(field.invalid).toBe(true);
    expect(field.error).toEqual('Constraints not satisfied');
    expect(listenerMock).toHaveBeenCalledTimes(1);

    field.refCallback(null);

    expect(field.invalid).toBe(false);
    expect(field.error).toBe(null);
    expect(listenerMock).toHaveBeenCalledTimes(2);
  });

  test('notifies the field when the value is changed', () => {
    const field = createField(objectAccessor, { foo: 0 }, constraintValidationPlugin());

    const listenerMock = jest.fn();
    const fooListenerMock = jest.fn();

    field.subscribe(listenerMock);
    field.at('foo').subscribe(fooListenerMock);

    element.value = 'aaa';
    element.required = true;

    expect(element.validationMessage).toBe('');
    expect(listenerMock).not.toHaveBeenCalled();

    field.at('foo').refCallback(element);

    expect(listenerMock).toHaveBeenCalledTimes(0);
    expect(field.at('foo').invalid).toBe(false);

    fireEvent.change(element, { target: { value: '' } });

    expect(listenerMock).toHaveBeenCalledTimes(1);
    expect(fooListenerMock).toHaveBeenCalledTimes(1);
  });

  test('does not notify an already invalid parent', () => {
    const field = createField(objectAccessor, { foo: 0 }, constraintValidationPlugin());

    const listenerMock = jest.fn();
    const fooListenerMock = jest.fn();

    field.subscribe(listenerMock);
    field.at('foo').subscribe(fooListenerMock);

    element.value = 'aaa';
    element.required = true;

    expect(element.validationMessage).toBe('');
    expect(listenerMock).not.toHaveBeenCalled();

    field.at('foo').refCallback(element);

    expect(listenerMock).toHaveBeenCalledTimes(0);
    expect(field.at('foo').invalid).toBe(false);

    fireEvent.change(element, { target: { value: '' } });

    expect(listenerMock).toHaveBeenCalledTimes(1);
    expect(fooListenerMock).toHaveBeenCalledTimes(1);
  });
});
