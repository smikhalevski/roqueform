import { createField, objectAccessor } from 'roqueform';
import { constraintValidationPlugin } from '../main';

describe('constraintValidationPlugin', () => {
  test('enhances the field', () => {
    const field = createField(objectAccessor, { foo: 0 }, constraintValidationPlugin());

    expect(field.invalid).toBe(false);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(false);
    expect(field.at('foo').error).toBe(null);
  });

  test('validates the root field', () => {
    const field = createField(objectAccessor, { foo: 0 }, constraintValidationPlugin());

    const element = document.createElement('input');
    element.type = 'email';
    element.required = true;

    field.at('foo').refCallback(element);

    expect(field.invalid).toBe(true);
    expect(field.error).toBe(null);

    expect(field.at('foo').invalid).toBe(true);
    expect(field.at('foo').error).toEqual('Constraints not satisfied');
  });
});
