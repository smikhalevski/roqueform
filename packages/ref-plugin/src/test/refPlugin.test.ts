import { applyPlugins, createField, objectAccessor } from 'roqueform';
import { refPlugin } from '../main';

describe('refPlugin', () => {
  test('adds an element property to the field', () => {
    const field = createField(objectAccessor, { bar: 111 }, refPlugin());

    expect(field.element).toBe(null);
    expect(field.at('bar').element).toBe(null);
  });

  test('refCallback updates an element property', () => {
    const field = createField(objectAccessor, { bar: 111 }, refPlugin());
    const element = document.createElement('input');

    field.refCallback(element);

    expect(field.element).toEqual(element);
  });

  test('preserves the refCallback from preceding plugin', () => {
    const refCallbackMock = jest.fn(() => undefined);

    const field = createField(
      objectAccessor,
      { bar: 111 },
      applyPlugins(field => Object.assign(field, { refCallback: refCallbackMock }), refPlugin())
    );

    field.refCallback(document.body);

    expect(refCallbackMock).toHaveBeenCalledTimes(1);
    expect(refCallbackMock).toHaveBeenNthCalledWith(1, document.body);
    expect(field.element).toBe(document.body);
  });
});
