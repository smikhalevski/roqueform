/**
 * @vitest-environment jsdom
 */

import { expect, test, vi } from 'vitest';
import React from 'react';
import { act, render } from '@testing-library/react';
import { FieldRenderer, useField } from '../main/index.js';
import { createField } from 'roqueform';

test('passes the field as an argument', () => {
  const TestComponent = () => {
    const rootField = useField({ aaa: 111 });

    return (
      <FieldRenderer field={rootField.at('aaa')}>
        {field => {
          expect(field).toBe(rootField.at('aaa'));
          return null;
        }}
      </FieldRenderer>
    );
  };

  render(<TestComponent />);
});

test('re-renders if field value is changed', () => {
  const renderMock = vi.fn();
  const rootField = createField();

  render(<FieldRenderer field={rootField}>{renderMock}</FieldRenderer>);

  act(() => rootField.setValue(111));

  expect(renderMock).toHaveBeenCalledTimes(2);
});

// test('does not re-render if child field value is changed', () => {
//   const renderMock = vi.fn();
//   const rootField = createField();
//
//   render(<FieldRenderer field={rootField}>{renderMock}</FieldRenderer>);
//
//   act(() => rootField.at('aaa').setValue(222));
//
//   expect(renderMock).toHaveBeenCalledTimes(1);
// });

test('re-renders if isEagerlyUpdated and child field value is changed', () => {
  const renderMock = vi.fn();
  const rootField = createField();

  render(
    <FieldRenderer
      field={rootField}
      isEagerlyUpdated={true}
    >
      {renderMock}
    </FieldRenderer>
  );

  act(() => rootField.at('aaa').setValue(222));

  expect(renderMock).toHaveBeenCalledTimes(2);
});

test('triggers onChange when value is changed non-transiently', async () => {
  const handleChangeMock = vi.fn();
  const rootField = createField();

  render(
    <FieldRenderer
      field={rootField.at('aaa')}
      onChange={handleChangeMock}
    >
      {() => null}
    </FieldRenderer>
  );

  act(() => rootField.at('aaa').setValue(222));

  expect(handleChangeMock).toHaveBeenCalledTimes(1);
  expect(handleChangeMock).toHaveBeenNthCalledWith(1, 222);
});

test('does not trigger onChange when value is changed transiently', async () => {
  const handleChangeMock = vi.fn();
  const rootField = createField();

  render(
    <FieldRenderer
      field={rootField.at('aaa')}
      onChange={handleChangeMock}
    >
      {() => null}
    </FieldRenderer>
  );

  act(() => {
    rootField.at('aaa').setTransientValue(222);
    rootField.at('aaa').setTransientValue(333);
  });

  expect(handleChangeMock).toHaveBeenCalledTimes(0);

  act(() => rootField.at('aaa').flushTransient());

  expect(handleChangeMock).toHaveBeenCalledTimes(1);
  expect(handleChangeMock).toHaveBeenNthCalledWith(1, 333);
});
