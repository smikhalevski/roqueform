import { act } from '@testing-library/react';
import { composePlugins, createField, validationPlugin } from 'roqueform';
import { scrollToErrorPlugin } from '../main';

class DOMRect {
  top;
  left;
  right = 0;
  bottom = 0;

  constructor(
    public x = 0,
    public y = 0,
    public width = 0,
    public height = 0
  ) {
    this.left = x;
    this.top = y;
  }

  toJSON() {
    return JSON.stringify(this);
  }
}

describe('scrollToErrorPlugin', () => {
  test('returns false if there are no errors', () => {
    const field = createField(
      { foo: 111 },
      composePlugins(
        validationPlugin(() => undefined),
        scrollToErrorPlugin()
      )
    );

    expect(field.scrollToError()).toBe(false);
  });

  test('scrolls to error at index with RTL text direction', async () => {
    const rootField = createField(
      { foo: 111, bar: 'aaa' },
      composePlugins(
        validationPlugin(() => undefined),
        scrollToErrorPlugin()
      )
    );

    const fooElement = document.body.appendChild(document.createElement('input'));
    const barElement = document.body.appendChild(document.createElement('input'));

    rootField.at('foo').refCallback(fooElement);
    rootField.at('bar').refCallback(barElement);

    jest.spyOn(fooElement, 'getBoundingClientRect').mockImplementation(() => new DOMRect(100));
    jest.spyOn(barElement, 'getBoundingClientRect').mockImplementation(() => new DOMRect(200));

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

  test('scrolls to error at index with LTR text direction', async () => {
    const rootField = createField(
      { foo: 111, bar: 'aaa' },
      composePlugins(
        validationPlugin(() => undefined),
        scrollToErrorPlugin()
      )
    );

    const fooElement = document.body.appendChild(document.createElement('input'));
    const barElement = document.body.appendChild(document.createElement('input'));

    rootField.at('foo').refCallback(fooElement);
    rootField.at('bar').refCallback(barElement);

    jest.spyOn(fooElement, 'getBoundingClientRect').mockImplementation(() => new DOMRect(100));
    jest.spyOn(barElement, 'getBoundingClientRect').mockImplementation(() => new DOMRect(200));

    const fooScrollIntoViewMock = (fooElement.scrollIntoView = jest.fn());
    const barScrollIntoViewMock = (barElement.scrollIntoView = jest.fn());

    await act(() => {
      rootField.at('foo').setError('error1');
      rootField.at('bar').setError('error2');
    });

    // Scroll to 0
    rootField.scrollToError(0, { direction: 'ltr' });
    expect(fooScrollIntoViewMock).not.toHaveBeenCalled();
    expect(barScrollIntoViewMock).toHaveBeenCalledTimes(1);
    fooScrollIntoViewMock.mockClear();
    barScrollIntoViewMock.mockClear();

    // Scroll to 1
    rootField.scrollToError(1, { direction: 'ltr' });
    expect(fooScrollIntoViewMock).toHaveBeenCalledTimes(1);
    expect(barScrollIntoViewMock).not.toHaveBeenCalled();
    fooScrollIntoViewMock.mockClear();
    barScrollIntoViewMock.mockClear();
  });
});
