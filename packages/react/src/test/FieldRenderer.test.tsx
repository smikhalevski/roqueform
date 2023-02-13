import React, { createElement } from 'react';
import { act, render } from '@testing-library/react';
import { FieldRenderer, useField } from '../main';
import { Field, Plugin } from 'roqueform';

describe('FieldRenderer', () => {
  test('passes the field as an argument', () => {
    render(
      createElement(() => {
        const rootField = useField({ foo: 'bar' });

        return (
          <FieldRenderer field={rootField.at('foo')}>
            {field => {
              expect(field).toBe(rootField.at('foo'));
              return null;
            }}
          </FieldRenderer>
        );
      })
    );
  });

  test('re-renders if field value is changed externally', async () => {
    const renderMock = jest.fn();

    let rootField!: Field;

    render(
      createElement(() => {
        rootField = useField();

        return <FieldRenderer field={rootField}>{renderMock}</FieldRenderer>;
      })
    );

    await act(() => rootField.setValue(111));

    expect(renderMock).toHaveBeenCalledTimes(2);
  });

  test('re-renders if field is notified', async () => {
    const renderMock = jest.fn();
    const plugin: Plugin = (_field, _accessor, notify) => {
      notifyCallback = notify;
    };

    let rootField!: Field;
    let notifyCallback!: () => void;

    render(
      createElement(() => {
        rootField = useField(undefined, plugin);

        return <FieldRenderer field={rootField}>{renderMock}</FieldRenderer>;
      })
    );

    await act(() => notifyCallback());

    expect(renderMock).toHaveBeenCalledTimes(2);
  });

  test('does not re-render if derived field value is changed externally', async () => {
    const renderMock = jest.fn();

    let rootField!: Field<{ foo: number }>;

    render(
      createElement(() => {
        rootField = useField({ foo: 111 });

        return <FieldRenderer field={rootField}>{renderMock}</FieldRenderer>;
      })
    );

    await act(() => rootField.at('foo').setValue(222));

    expect(renderMock).toHaveBeenCalledTimes(1);
  });

  test('does not re-render if eagerlyUpdated and derived field value is changed externally', async () => {
    const renderMock = jest.fn();

    let rootField!: Field<{ foo: number }>;

    render(
      createElement(() => {
        rootField = useField({ foo: 111 });

        return (
          <FieldRenderer
            field={rootField}
            eagerlyUpdated={true}
          >
            {renderMock}
          </FieldRenderer>
        );
      })
    );

    await act(() => rootField.at('foo').setValue(222));

    expect(renderMock).toHaveBeenCalledTimes(2);
  });

  test('triggers onChange handler when value is changed non-transiently', async () => {
    const handleChangeMock = jest.fn();

    let rootField!: Field<{ foo: number }>;

    render(
      createElement(() => {
        rootField = useField({ foo: 111 });

        return (
          <FieldRenderer
            field={rootField.at('foo')}
            onChange={handleChangeMock}
          >
            {() => null}
          </FieldRenderer>
        );
      })
    );

    await act(() => rootField.at('foo').setValue(222));

    expect(handleChangeMock).toHaveBeenCalledTimes(1);
    expect(handleChangeMock).toHaveBeenNthCalledWith(1, 222);
  });

  test('triggers onChange handler when value is changed transiently', async () => {
    const handleChangeMock = jest.fn();

    let rootField!: Field<{ foo: number }>;

    render(
      createElement(() => {
        rootField = useField({ foo: 111 });

        return (
          <FieldRenderer
            field={rootField.at('foo')}
            onChange={handleChangeMock}
          >
            {() => null}
          </FieldRenderer>
        );
      })
    );

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
