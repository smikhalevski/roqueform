import { createField, objectAccessor } from "roqueform";
import { statesPlugin } from "../main";

describe('statesPlugin', () => {
  test('sets dirty to "true" and "false"', () => {
    const initialValue = { foo: 0 };
    const field = createField(objectAccessor, initialValue, statesPlugin());

    field.at('foo').dispatchValue(2);

    expect(field.at('foo').isDirty()).toBe(true);
    expect(field.isDirty()).toBe(true);

    field.dispatchValue(initialValue);

    expect(field.at('foo').isDirty()).toBe(false);
    expect(field.isDirty()).toBe(false);
  });

  test('cleans dirty flags and resets values to initial', () => {
    const field = createField(objectAccessor, { foo: 0 }, statesPlugin());

    field.at('foo').dispatchValue(2);

    expect(field.isDirty()).toBe(true);
    expect(field.at('foo').isDirty()).toBe(true);

    field.reset();

    expect(field.at('foo').isDirty()).toBe(false);
    expect(field.isDirty()).toBe(false);
  });
});
