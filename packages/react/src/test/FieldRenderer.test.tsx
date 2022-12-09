import React from 'react';
import { act, render } from '@testing-library/react';
import { FieldRenderer, useField } from '../main';
import { Field } from 'roqueform';

describe('FieldRenderer', () => {
  test('passes the field as an argument', () => {
    const Test = () => {
      const rootField = useField({ foo: 'bar' });

      return (
        <FieldRenderer field={rootField.at('foo')}>
          {field => {
            expect(field).toBe(rootField.at('foo'));
            return null;
          }}
        </FieldRenderer>
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
        <FieldRenderer field={rootField}>
          {() => {
            renderCount++;
            return null;
          }}
        </FieldRenderer>
      );
    };

    render(<Test />);

    await act(() => rootField.setValue(111));

    expect(renderCount).toBe(2);
  });

  test('re-renders if field is notified', async () => {
    let renderCount = 0;
    let rootField!: Field;

    const Test = () => {
      rootField = useField();

      return (
        <FieldRenderer field={rootField}>
          {() => {
            renderCount++;
            return null;
          }}
        </FieldRenderer>
      );
    };

    render(<Test />);

    await act(() => rootField.notify());

    expect(renderCount).toBe(2);
  });

  test('does not re-render if derived field value is changed externally', async () => {
    let renderCount = 0;
    let rootField!: Field<{ foo: number }>;

    const Test = () => {
      rootField = useField({ foo: 111 });

      return (
        <FieldRenderer field={rootField}>
          {() => {
            renderCount++;
            return null;
          }}
        </FieldRenderer>
      );
    };

    render(<Test />);

    await act(() => rootField.at('foo').setValue(222));

    expect(renderCount).toBe(1);
  });

  test('does not re-render if eagerlyUpdated and derived field value is changed externally', async () => {
    let renderCount = 0;
    let rootField!: Field<{ foo: number }>;

    const Test = () => {
      rootField = useField({ foo: 111 });

      return (
        <FieldRenderer
          field={rootField}
          eagerlyUpdated={true}
        >
          {() => {
            renderCount++;
            return null;
          }}
        </FieldRenderer>
      );
    };

    render(<Test />);

    await act(() => rootField.at('foo').setValue(222));

    expect(renderCount).toBe(2);
  });

  test('triggers onChange handler when value is changed non-transiently', async () => {
    let handleChangeMock = jest.fn();
    let rootField!: Field<{ foo: number }>;

    const Test = () => {
      rootField = useField({ foo: 111 });

      return (
        <FieldRenderer
          field={rootField.at('foo')}
          onChange={handleChangeMock}
        >
          {() => null}
        </FieldRenderer>
      );
    };

    render(<Test />);

    await act(() => rootField.at('foo').setValue(222));

    expect(handleChangeMock).toHaveBeenCalledTimes(1);
    expect(handleChangeMock).toHaveBeenNthCalledWith(1, 222);
  });

  test('triggers onChange handler when value is changed transiently', async () => {
    let handleChangeMock = jest.fn();
    let rootField!: Field<{ foo: number }>;

    const Test = () => {
      rootField = useField({ foo: 111 });

      return (
        <FieldRenderer
          field={rootField.at('foo')}
          onChange={handleChangeMock}
        >
          {() => null}
        </FieldRenderer>
      );
    };

    render(<Test />);

    await act(() => {
      rootField.at('foo').setTransientValue(222);
      rootField.at('foo').setTransientValue(333);
    });

    expect(handleChangeMock).toHaveBeenCalledTimes(0);

    await act(() => rootField.at('foo').dispatch());

    expect(handleChangeMock).toHaveBeenCalledTimes(1);
    expect(handleChangeMock).toHaveBeenNthCalledWith(1, 333);
  });
});
