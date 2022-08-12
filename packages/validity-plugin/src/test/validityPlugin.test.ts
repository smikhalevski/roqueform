import { createField, objectAccessor } from 'roqueform';
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
});
