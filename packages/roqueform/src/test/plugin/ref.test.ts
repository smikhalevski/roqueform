import { composePlugins, createField } from '../../../lib';
import { refPlugin } from '@roqueform/ref-plugin/src/main';

describe('refPlugin', () => {
  test('adds an element property to the field', () => {
    const field = createField({ aaa: 111 }, refPlugin());

    expect(field.element).toBeNull();
    expect(field.at('aaa').element).toBeNull();
  });

  test('ref updates an element property', () => {
    const field = createField({ aaa: 111 }, refPlugin());
    const element = document.createElement('input');

    field.ref(element);

    expect(field.element).toEqual(element);
  });

  test('preserves the ref from preceding plugin', () => {
    const refMock = jest.fn();

    const field = createField(
      { aaa: 111 },
      composePlugins(field => Object.assign(field, { ref: refMock }), refPlugin())
    );

    field.ref(document.body);

    expect(refMock).toHaveBeenCalledTimes(1);
    expect(refMock).toHaveBeenNthCalledWith(1, document.body);
    expect(field.element).toBe(document.body);
  });
});
