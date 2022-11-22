import React from 'react';
import { act, render } from '@testing-library/react';
import {
  applyPlugins,
  createField,
  Field,
  objectAccessor,
  Plugin,
  ValidationPlugin,
  validationPlugin,
} from 'roqueform';
import { RefPlugin, refPlugin } from '@roqueform/ref-plugin';
import { ScrollToErrorPlugin, scrollToErrorPlugin } from '../main';

describe('scrollToErrorPlugin', () => {
  function anotherValidationPlugin<T>(): Plugin<T, ValidationPlugin<T, string, never>> {
    return validationPlugin({
      validate(field, setInternalError, options) {
        return { ok: true, value: field.value };
      },
      async validateAsync(field, setInternalError, options, signal) {
        return { ok: true, value: field.value };
      },
    });
  }

  test('returns false if there are no errors', () => {
    const field = createField(
      objectAccessor,
      { foo: 111 },
      applyPlugins(refPlugin(), anotherValidationPlugin(), scrollToErrorPlugin())
    );

    expect(field.scrollToError()).toBe(false);
  });

  test('scrolls to error at index', async () => {
    let rootField!: Field<
      { foo: number; bar: string },
      ScrollToErrorPlugin & RefPlugin<Element> & ValidationPlugin<{ foo: number; bar: string }, string, never>
    > &
      ScrollToErrorPlugin &
      RefPlugin<Element> &
      ValidationPlugin<{ foo: number; bar: string }, string, never>;

    const Test = () => {
      rootField = createField(
        objectAccessor,
        { foo: 111, bar: 'aaa' },
        applyPlugins(refPlugin(), anotherValidationPlugin(), scrollToErrorPlugin())
      );

      return (
        <>
          <Field field={rootField.at('foo')}>
            {field => (
              <input
                id="foo"
                type="number"
                ref={field.refCallback}
                value={field.value}
                onChange={event => {
                  field.setValue(event.target.valueAsNumber);
                }}
              />
            )}
          </Field>
          <Field field={rootField.at('bar')}>
            {field => (
              <input
                id="bar"
                type="text"
                ref={field.refCallback}
                value={field.value}
                onChange={event => {
                  field.setValue(event.target.value);
                }}
              />
            )}
          </Field>
        </>
      );
    };

    render(<Test />);

    const fooElement = document.getElementById('foo')!;
    const barElement = document.getElementById('bar')!;

    jest
      .spyOn(fooElement, 'getBoundingClientRect')
      .mockImplementation(
        () => ({ bottom: 0, height: 0, left: 0, right: 0, top: 100, width: 0, x: 0, y: 0 } as DOMRect)
      );

    jest
      .spyOn(barElement, 'getBoundingClientRect')
      .mockImplementation(
        () => ({ bottom: 0, height: 0, left: 0, right: 0, top: 200, width: 0, x: 0, y: 0 } as DOMRect)
      );

    const fooScrollIntoViewMock = (fooElement.scrollIntoView = jest.fn());
    const barScrollIntoViewMock = (barElement.scrollIntoView = jest.fn());

    await act(() => {
      rootField.at('foo').setError('error1');
      rootField.at('bar').setError('error2');
    });

    // Scroll to default index
    rootField.scrollToError();
    expect(fooScrollIntoViewMock).toHaveBeenCalledTimes(1);
    expect(barScrollIntoViewMock).not.toHaveBeenCalled();
    fooScrollIntoViewMock.mockClear();
    barScrollIntoViewMock.mockClear();

    // Scroll to 0
    rootField.scrollToError(0);
    expect(fooScrollIntoViewMock).toHaveBeenCalledTimes(1);
    expect(barScrollIntoViewMock).not.toHaveBeenCalled();
    fooScrollIntoViewMock.mockClear();
    barScrollIntoViewMock.mockClear();

    // Scroll to 1
    rootField.scrollToError(1);
    expect(fooScrollIntoViewMock).not.toHaveBeenCalled();
    expect(barScrollIntoViewMock).toHaveBeenCalledTimes(1);
    fooScrollIntoViewMock.mockClear();
    barScrollIntoViewMock.mockClear();

    // Scroll to 2
    rootField.scrollToError(2);
    expect(fooScrollIntoViewMock).not.toHaveBeenCalled();
    expect(barScrollIntoViewMock).not.toHaveBeenCalled();
    fooScrollIntoViewMock.mockClear();
    barScrollIntoViewMock.mockClear();

    // Scroll to -1
    rootField.scrollToError(1);
    expect(fooScrollIntoViewMock).not.toHaveBeenCalled();
    expect(barScrollIntoViewMock).toHaveBeenCalledTimes(1);
    fooScrollIntoViewMock.mockClear();
    barScrollIntoViewMock.mockClear();

    // Scroll to -2
    rootField.scrollToError(-2);
    expect(fooScrollIntoViewMock).toHaveBeenCalledTimes(1);
    expect(barScrollIntoViewMock).not.toHaveBeenCalled();
    fooScrollIntoViewMock.mockClear();
    barScrollIntoViewMock.mockClear();

    // Scroll to -3
    rootField.scrollToError(-3);
    expect(fooScrollIntoViewMock).not.toHaveBeenCalled();
    expect(barScrollIntoViewMock).not.toHaveBeenCalled();
    fooScrollIntoViewMock.mockClear();
    barScrollIntoViewMock.mockClear();
  });
});
