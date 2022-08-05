import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { Field, useField } from '../main';

describe('Field', () => {
  test('passes the field as an argument', () => {
    const Test = () => {
      const rootField = useField({ foo: 'bar' });

      return (
        <Field field={rootField.at('foo')}>
          {field => {
            expect(field).toBe(rootField.at('foo'));
            return null;
          }}
        </Field>
      );
    };

    render(<Test />);
  });

  test('re-renders if field value is changed externally', async () => {
    let renderCount = 0;
    let rootField!: Field;

    const Test = () => {
      rootField = useField();

      return (
        <Field field={rootField}>
          {() => {
            renderCount++;
            return null;
          }}
        </Field>
      );
    };

    render(<Test />);

    await waitFor(() => rootField.dispatchValue(111));

    await waitFor(() => expect(renderCount).toBe(2));
  });

  test('re-renders if field is notified', async () => {
    let renderCount = 0;
    let rootField!: Field;

    const Test = () => {
      rootField = useField();

      return (
        <Field field={rootField}>
          {() => {
            renderCount++;
            return null;
          }}
        </Field>
      );
    };

    render(<Test />);

    await waitFor(() => rootField.notify());

    await waitFor(() => expect(renderCount).toBe(2));
  });

  test('does not re-render if derived field value is changed externally', async () => {
    let renderCount = 0;
    let rootField!: Field<{ foo: number }>;

    const Test = () => {
      rootField = useField({ foo: 111 });

      return (
        <Field field={rootField}>
          {() => {
            renderCount++;
            return null;
          }}
        </Field>
      );
    };

    render(<Test />);

    await waitFor(() => rootField.at('foo').dispatchValue(222));

    await waitFor(() => expect(renderCount).toBe(1));
  });

  test('does not re-render if eagerlyUpdated and derived field value is changed externally', async () => {
    let renderCount = 0;
    let rootField!: Field<{ foo: number }>;

    const Test = () => {
      rootField = useField({ foo: 111 });

      return (
        <Field
          field={rootField}
          eagerlyUpdated={true}
        >
          {() => {
            renderCount++;
            return null;
          }}
        </Field>
      );
    };

    render(<Test />);

    await waitFor(() => rootField.at('foo').dispatchValue(222));

    await waitFor(() => expect(renderCount).toBe(2));
  });
});
