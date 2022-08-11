import { createField, objectAccessor } from 'roqueform';
import { resetPlugin } from '../main';

describe('resetPlugin', () => {
  test('flags field as dirty if current field value is equal to an initial value', () => {
    const initialValue = { foo: 111 };

    const field = createField(objectAccessor, initialValue, resetPlugin());

    field.at('foo').dispatchValue(222);

    expect(field.at('foo').isDirty()).toBe(true);
    expect(field.isDirty()).toBe(true);

    field.dispatchValue(initialValue);

    expect(field.at('foo').isDirty()).toBe(false);
    expect(field.isDirty()).toBe(false);
  });

  test('field is dirty if its value is updated even before the Field instance is created', () => {
    const field = createField(objectAccessor, { foo: 111 }, resetPlugin());

    field.dispatchValue({ foo: 222 });

    expect(field.at('foo').isDirty()).toBe(true);
  });

  test('cleans dirty flag and resets to the initial value', () => {
    const field = createField(objectAccessor, { foo: 111 }, resetPlugin());

    field.at('foo').dispatchValue(222);

    expect(field.isDirty()).toBe(true);
    expect(field.at('foo').isDirty()).toBe(true);

    field.reset();

    expect(field.at('foo').isDirty()).toBe(false);
    expect(field.isDirty()).toBe(false);
  });
});
