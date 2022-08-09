import { createField, objectAccessor } from 'roqueform';
import { StatesPlugin, statesPlugin } from '../main';

describe('statesPlugin', () => {
  test('set dirty to "true" and "false"', () => {
    const field = createField<{ foo: number }, StatesPlugin>(objectAccessor, { foo: 0 }, statesPlugin());

    field.at('foo').dispatchValue(2);

    expect(field.at('foo').isDirty()).toBe(true);
    expect(field.isDirty()).toBe(true);

    field.at('foo').dispatchValue(0);

    expect(field.at('foo').isDirty()).toBe(false);
    expect(field.isDirty()).toBe(false);
  });

  test('set dirty to "true" and "false" from root field', () => {
    const initialValue: { foo: number } = { foo: 0 };
    const field = createField<{ foo: number }, StatesPlugin>(objectAccessor, initialValue, statesPlugin());

    field.at('foo');

    field.dispatchValue({ foo: 2 });

    expect(field.isDirty()).toBe(true);
    expect(field.at('foo').isDirty()).toBe(true);
    //
    // field.dispatchValue(initialValue);
    //
    // expect(field.at('foo').isDirty()).toBe(false);
    // expect(field.isDirty()).toBe(false);
  });
});
