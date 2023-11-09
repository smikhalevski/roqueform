import { createField } from 'roqueform';
import { resetPlugin } from '../main';

describe('resetPlugin', () => {
  test('field is dirty if the field value is not equal to an initial value', () => {
    const initialValue = { foo: 111 };

    const field = createField(initialValue, resetPlugin());

    expect(field.initialValue).toBe(initialValue);
    expect(field.at('foo').initialValue).toBe(111);

    field.at('foo').setValue(222);

    expect(field.at('foo').isDirty).toBe(true);
    expect(field.isDirty).toBe(true);

    field.setValue(initialValue);

    expect(field.at('foo').isDirty).toBe(false);
    expect(field.isDirty).toBe(false);
  });

  test('field is not dirty it has the value that is deeply equal to the initial value', () => {
    const initialValue = { foo: 111 };

    const field = createField(initialValue, resetPlugin());

    field.at('foo').setValue(222);

    expect(field.at('foo').isDirty).toBe(true);
    expect(field.isDirty).toBe(true);

    field.setValue({ foo: 111 });

    expect(field.at('foo').isDirty).toBe(false);
    expect(field.isDirty).toBe(false);
  });

  test('updates the initial value and notifies fields', () => {
    const subscriberMock = jest.fn();
    const fooListenerMock = jest.fn();

    const initialValue = { foo: 111 };

    const field = createField(initialValue, resetPlugin());

    field.subscribe(subscriberMock);
    field.at('foo').subscribe(fooListenerMock);

    const initialValue2 = { foo: 222 };

    field.setInitialValue(initialValue2);

    expect(subscriberMock).toHaveBeenCalledTimes(1);
    expect(fooListenerMock).toHaveBeenCalledTimes(1);
    expect(field.at('foo').initialValue).toBe(222);
    expect(field.at('foo').isDirty).toBe(true);
    expect(field.initialValue).toBe(initialValue2);
    expect(field.isDirty).toBe(true);
  });

  test('derived field is dirty if its value was updated before the Field instance was created', () => {
    const field = createField({ foo: 111 }, resetPlugin());

    field.setValue({ foo: 222 });

    expect(field.at('foo').isDirty).toBe(true);
  });

  test('resets to the initial value', () => {
    const field = createField({ foo: 111 }, resetPlugin());

    field.at('foo').setValue(222);

    expect(field.isDirty).toBe(true);
    expect(field.at('foo').isDirty).toBe(true);

    field.reset();

    expect(field.at('foo').isDirty).toBe(false);
    expect(field.isDirty).toBe(false);
  });
});
