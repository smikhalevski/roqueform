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
      { aaa: 111 },
      composePlugins(
        validationPlugin(() => undefined),
        scrollToErrorPlugin()
      )
    );

    expect(field.scrollToError()).toBe(false);
  });

  test('scrolls to error at index with RTL text direction', async () => {
    const rootField = createField(
      { aaa: 111, bbb: 222 },
      composePlugins(
        validationPlugin(() => undefined),
        scrollToErrorPlugin()
      )
    );

    const aaaElement = document.body.appendChild(document.createElement('input'));
    const bbbElement = document.body.appendChild(document.createElement('input'));

    rootField.at('aaa').ref(aaaElement);
    rootField.at('bbb').ref(bbbElement);

    jest.spyOn(aaaElement, 'getBoundingClientRect').mockImplementation(() => new DOMRect(100));
    jest.spyOn(bbbElement, 'getBoundingClientRect').mockImplementation(() => new DOMRect(200));

    const aaaScrollIntoViewMock = (aaaElement.scrollIntoView = jest.fn());
    const bbbScrollIntoViewMock = (bbbElement.scrollIntoView = jest.fn());

    await act(() => {
      rootField.at('aaa').setError('error1');
      rootField.at('bbb').setError('error2');
    });

    // Scroll to default index
    rootField.scrollToError();
    expect(aaaScrollIntoViewMock).toHaveBeenCalledTimes(1);
    expect(bbbScrollIntoViewMock).not.toHaveBeenCalled();
    aaaScrollIntoViewMock.mockClear();
    bbbScrollIntoViewMock.mockClear();

    // Scroll to 0
    rootField.scrollToError(0);
    expect(aaaScrollIntoViewMock).toHaveBeenCalledTimes(1);
    expect(bbbScrollIntoViewMock).not.toHaveBeenCalled();
    aaaScrollIntoViewMock.mockClear();
    bbbScrollIntoViewMock.mockClear();

    // Scroll to 1
    rootField.scrollToError(1);
    expect(aaaScrollIntoViewMock).not.toHaveBeenCalled();
    expect(bbbScrollIntoViewMock).toHaveBeenCalledTimes(1);
    aaaScrollIntoViewMock.mockClear();
    bbbScrollIntoViewMock.mockClear();

    // Scroll to 2
    rootField.scrollToError(2);
    expect(aaaScrollIntoViewMock).not.toHaveBeenCalled();
    expect(bbbScrollIntoViewMock).not.toHaveBeenCalled();
    aaaScrollIntoViewMock.mockClear();
    bbbScrollIntoViewMock.mockClear();

    // Scroll to -1
    rootField.scrollToError(1);
    expect(aaaScrollIntoViewMock).not.toHaveBeenCalled();
    expect(bbbScrollIntoViewMock).toHaveBeenCalledTimes(1);
    aaaScrollIntoViewMock.mockClear();
    bbbScrollIntoViewMock.mockClear();

    // Scroll to -2
    rootField.scrollToError(-2);
    expect(aaaScrollIntoViewMock).toHaveBeenCalledTimes(1);
    expect(bbbScrollIntoViewMock).not.toHaveBeenCalled();
    aaaScrollIntoViewMock.mockClear();
    bbbScrollIntoViewMock.mockClear();

    // Scroll to -3
    rootField.scrollToError(-3);
    expect(aaaScrollIntoViewMock).not.toHaveBeenCalled();
    expect(bbbScrollIntoViewMock).not.toHaveBeenCalled();
    aaaScrollIntoViewMock.mockClear();
    bbbScrollIntoViewMock.mockClear();
  });

  test('scrolls to error at index with LTR text direction', async () => {
    const rootField = createField(
      { aaa: 111, bbb: 222 },
      composePlugins(
        validationPlugin(() => undefined),
        scrollToErrorPlugin()
      )
    );

    const aaaElement = document.body.appendChild(document.createElement('input'));
    const bbbElement = document.body.appendChild(document.createElement('input'));

    rootField.at('aaa').ref(aaaElement);
    rootField.at('bbb').ref(bbbElement);

    jest.spyOn(aaaElement, 'getBoundingClientRect').mockImplementation(() => new DOMRect(100));
    jest.spyOn(bbbElement, 'getBoundingClientRect').mockImplementation(() => new DOMRect(200));

    const aaaScrollIntoViewMock = (aaaElement.scrollIntoView = jest.fn());
    const bbbScrollIntoViewMock = (bbbElement.scrollIntoView = jest.fn());

    await act(() => {
      rootField.at('aaa').setError('error1');
      rootField.at('bbb').setError('error2');
    });

    // Scroll to 0
    rootField.scrollToError(0, { direction: 'ltr' });
    expect(aaaScrollIntoViewMock).not.toHaveBeenCalled();
    expect(bbbScrollIntoViewMock).toHaveBeenCalledTimes(1);
    aaaScrollIntoViewMock.mockClear();
    bbbScrollIntoViewMock.mockClear();

    // Scroll to 1
    rootField.scrollToError(1, { direction: 'ltr' });
    expect(aaaScrollIntoViewMock).toHaveBeenCalledTimes(1);
    expect(bbbScrollIntoViewMock).not.toHaveBeenCalled();
    aaaScrollIntoViewMock.mockClear();
    bbbScrollIntoViewMock.mockClear();
  });
});
