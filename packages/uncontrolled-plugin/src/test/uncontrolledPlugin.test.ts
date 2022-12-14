import { uncontrolledPlugin } from '../main';
import { createField, objectAccessor } from 'roqueform';
import { fireEvent } from '@testing-library/dom';

describe('uncontrolledPlugin', () => {
  let element: HTMLInputElement;

  beforeEach(() => {
    element = document.body.appendChild(document.createElement('input'));
  });

  afterEach(() => {
    element.remove();
  });

  test('updates field value on input change', () => {
    const listenerMock = jest.fn();
    const field = createField(objectAccessor, { foo: 0 }, uncontrolledPlugin());

    element.type = 'number';

    field.subscribe(listenerMock);
    field.at('foo').refCallback(element);

    fireEvent.change(element, { target: { value: '111' } });

    expect(listenerMock).toHaveBeenCalledTimes(1);
    expect(field.value).toEqual({ foo: 111 });
  });

  test('updates input value on field change', () => {
    const field = createField(objectAccessor, { foo: 0 }, uncontrolledPlugin());

    field.at('foo').refCallback(element);
    field.at('foo').setValue(111);

    expect(element.value).toBe('111');
  });

  test('sets the initial value to the element', () => {
    const field = createField(objectAccessor, { foo: 111 }, uncontrolledPlugin());

    element.type = 'number';

    field.at('foo').refCallback(element);

    expect(element.value).toBe('111');
  });
});
