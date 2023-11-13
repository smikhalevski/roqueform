import React, { createElement } from 'react';
import { act, render } from '@testing-library/react';
import { FieldRenderer, useField } from '../main';
import { createField } from 'roqueform';

describe('FieldRenderer', () => {
  test('passes the field as an argument', () => {
    render(
      createElement(() => {
        const rootField = useField({ aaa: 111 });

        return (
          <FieldRenderer field={rootField.at('aaa')}>
            {field => {
              expect(field).toBe(rootField.at('aaa'));
              return null;
            }}
          </FieldRenderer>
        );
      })
    );
  });

  test('re-renders if field value is changed', async () => {
    const renderMock = jest.fn();
    const rootField = createField();

    render(createElement(() => <FieldRenderer field={rootField}>{renderMock}</FieldRenderer>));

    await act(() => rootField.setValue(111));

    expect(renderMock).toHaveBeenCalledTimes(2);
  });

  test('does not re-render if child field value is changed', async () => {
    const renderMock = jest.fn();
    const rootField = createField();

    render(createElement(() => <FieldRenderer field={rootField}>{renderMock}</FieldRenderer>));

    await act(() => rootField.at('aaa').setValue(222));

    expect(renderMock).toHaveBeenCalledTimes(1);
  });

  test('re-renders if eagerlyUpdated and child field value is changed', async () => {
    const renderMock = jest.fn();
    const rootField = createField();

    render(
      createElement(() => (
        <FieldRenderer
          field={rootField}
          eagerlyUpdated={true}
        >
          {renderMock}
        </FieldRenderer>
      ))
    );

    await act(() => rootField.at('aaa').setValue(222));

    expect(renderMock).toHaveBeenCalledTimes(2);
  });

  test('triggers onChange when value is changed non-transiently', async () => {
    const handleChangeMock = jest.fn();
    const rootField = createField();

    render(
      createElement(() => (
        <FieldRenderer
          field={rootField.at('aaa')}
          onChange={handleChangeMock}
        >
          {() => null}
        </FieldRenderer>
      ))
    );

    await act(() => rootField.at('aaa').setValue(222));

    expect(handleChangeMock).toHaveBeenCalledTimes(1);
    expect(handleChangeMock).toHaveBeenNthCalledWith(1, 222);
  });

  test('does not trigger onChange when value is changed transiently', async () => {
    const handleChangeMock = jest.fn();
    const rootField = createField();

    render(
      createElement(() => (
        <FieldRenderer
          field={rootField.at('aaa')}
          onChange={handleChangeMock}
        >
          {() => null}
        </FieldRenderer>
      ))
    );

    await act(() => {
      rootField.at('aaa').setTransientValue(222);
      rootField.at('aaa').setTransientValue(333);
    });

    expect(handleChangeMock).toHaveBeenCalledTimes(0);

    await act(() => rootField.at('aaa').propagate());

    expect(handleChangeMock).toHaveBeenCalledTimes(1);
    expect(handleChangeMock).toHaveBeenNthCalledWith(1, 333);
  });
});
