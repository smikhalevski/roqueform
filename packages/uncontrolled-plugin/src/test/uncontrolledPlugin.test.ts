import { uncontrolledPlugin } from '../main';
import { applyPlugins, createField, objectAccessor } from 'roqueform';
import { fireEvent } from '@testing-library/dom';
import { refPlugin } from '@roqueform/ref-plugin';

describe('uncontrolledPlugin', () => {
  let inputElement: HTMLInputElement;

  beforeEach(() => {
    inputElement = document.body.appendChild(document.createElement('input'));
  });

  afterEach(() => {
    inputElement.remove();
  });

  test('updates field value on input change', () => {
    const listenerMock = jest.fn();
    const field = createField(objectAccessor, { foo: 0 }, applyPlugins(refPlugin(), uncontrolledPlugin()));

    inputElement.type = 'number';

    field.subscribe(listenerMock);
    field.at('foo').refCallback(inputElement);

    fireEvent.change(inputElement, { target: { value: '111' } });

    expect(listenerMock).toHaveBeenCalledTimes(1);
    expect(field.value).toEqual({ foo: 111 });
  });

  test('updates input value on field change', () => {
    const field = createField(objectAccessor, { foo: 0 }, applyPlugins(refPlugin(), uncontrolledPlugin()));

    field.at('foo').refCallback(inputElement);
    field.at('foo').setValue(111);

    expect(inputElement.value).toBe('111');
  });

  test('sets the initial value to the element', () => {
    const field = createField(objectAccessor, { foo: 111 }, applyPlugins(refPlugin(), uncontrolledPlugin()));

    inputElement.type = 'number';

    field.at('foo').refCallback(inputElement);

    expect(inputElement.value).toBe('111');
  });
});
