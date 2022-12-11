import { applyPlugins, createField, objectAccessor } from 'roqueform';
import { refPlugin } from '../main';

describe('refPlugin', () => {
  test('adds ref property to the field', () => {
    const field = createField(objectAccessor, { bar: 111 }, refPlugin());

    expect(field.ref).toEqual({ current: null });
    expect(field.at('bar').ref).toEqual({ current: null });
  });

  test('refCallback updates ref', () => {
    const field = createField(objectAccessor, { bar: 111 }, refPlugin());
    const element = document.createElement('input');

    field.refCallback(element);

    expect(field.ref).toEqual({ current: element });
  });

  test('preserves the ref from preceding plugin', () => {
    const ref = { current: null };

    const field = createField(
      objectAccessor,
      { bar: 111 },
      applyPlugins(field => Object.assign(field, { ref }), refPlugin())
    );

    expect(field.ref).toBe(ref);
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
    expect(field.ref.current).toBe(document.body);
  });
});
