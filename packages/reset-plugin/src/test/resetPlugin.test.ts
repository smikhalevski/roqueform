import { createField } from 'roqueform';
import { resetPlugin } from '../main';

describe('resetPlugin', () => {
  test('field is dirty if the field value is not equal to an initial value', () => {
    const initialValue = { aaa: 111 };

    const field = createField(initialValue, resetPlugin());

    expect(field.initialValue).toBe(initialValue);
    expect(field.at('aaa').initialValue).toBe(111);

    field.at('aaa').setValue(222);

    expect(field.at('aaa').isDirty).toBe(true);
    expect(field.isDirty).toBe(true);

    field.setValue(initialValue);

    expect(field.at('aaa').isDirty).toBe(false);
    expect(field.isDirty).toBe(false);
  });

  test('field is not dirty it has the value that is deeply equal to the initial value', () => {
    const initialValue = { aaa: 111 };

    const field = createField(initialValue, resetPlugin());

    field.at('aaa').setValue(222);

    expect(field.at('aaa').isDirty).toBe(true);
    expect(field.isDirty).toBe(true);

    field.setValue({ aaa: 111 });

    expect(field.at('aaa').isDirty).toBe(false);
    expect(field.isDirty).toBe(false);
  });

  test('updates the initial value and notifies fields', () => {
    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();

    const initialValue = { aaa: 111 };

    const field = createField(initialValue, resetPlugin());

    field.on('change:initialValue', subscriberMock);
    field.at('aaa').on('change:initialValue', aaaSubscriberMock);

    const initialValue2 = { aaa: 222 };

    field.setInitialValue(initialValue2);

    expect(subscriberMock).toHaveBeenCalledTimes(1);
    expect(aaaSubscriberMock).toHaveBeenCalledTimes(1);
    expect(field.at('aaa').initialValue).toBe(222);
    expect(field.at('aaa').isDirty).toBe(true);
    expect(field.initialValue).toBe(initialValue2);
    expect(field.isDirty).toBe(true);
  });

  test('child field is dirty if its value was updated before the Field instance was created', () => {
    const field = createField({ aaa: 111 }, resetPlugin());

    field.setValue({ aaa: 222 });

    expect(field.at('aaa').isDirty).toBe(true);
  });

  test('resets to the initial value', () => {
    const field = createField({ aaa: 111 }, resetPlugin());

    field.at('aaa').setValue(222);

    expect(field.isDirty).toBe(true);
    expect(field.at('aaa').isDirty).toBe(true);

    field.reset();

    expect(field.at('aaa').isDirty).toBe(false);
    expect(field.isDirty).toBe(false);
  });
});
