import { act } from '@testing-library/react';
import { composePlugins, createField, errorsPlugin } from 'roqueform';
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
  test('returns null if there are no errors', () => {
    const field = createField({ aaa: 111 }, scrollToErrorPlugin());

    expect(field.scrollToError()).toBe(null);
  });

  test('scrolls to error at index with LTR text direction', () => {
    const rootField = createField({ aaa: 111, bbb: 222 }, composePlugins(errorsPlugin(), scrollToErrorPlugin()));

    const aaaElement = document.body.appendChild(document.createElement('input'));
    const bbbElement = document.body.appendChild(document.createElement('input'));

    rootField.at('aaa').ref(aaaElement);
    rootField.at('bbb').ref(bbbElement);

    jest.spyOn(aaaElement, 'getBoundingClientRect').mockImplementation(() => new DOMRect(100));
    jest.spyOn(bbbElement, 'getBoundingClientRect').mockImplementation(() => new DOMRect(200));

    const aaaScrollIntoViewMock = (aaaElement.scrollIntoView = jest.fn());
    const bbbScrollIntoViewMock = (bbbElement.scrollIntoView = jest.fn());

    act(() => {
      rootField.at('aaa').addError('error1');
      rootField.at('bbb').addError('error2');
    });

    // Scroll to default index
    expect(rootField.scrollToError()).toBe(rootField.at('aaa'));
    expect(aaaScrollIntoViewMock).toHaveBeenCalledTimes(1);
    expect(bbbScrollIntoViewMock).not.toHaveBeenCalled();
    aaaScrollIntoViewMock.mockClear();
    bbbScrollIntoViewMock.mockClear();

    // Scroll to 0
    expect(rootField.scrollToError(0)).toBe(rootField.at('aaa'));
    expect(aaaScrollIntoViewMock).toHaveBeenCalledTimes(1);
    expect(bbbScrollIntoViewMock).not.toHaveBeenCalled();
    aaaScrollIntoViewMock.mockClear();
    bbbScrollIntoViewMock.mockClear();

    // Scroll to 1
    expect(rootField.scrollToError(1)).toBe(rootField.at('bbb'));
    expect(aaaScrollIntoViewMock).not.toHaveBeenCalled();
    expect(bbbScrollIntoViewMock).toHaveBeenCalledTimes(1);
    aaaScrollIntoViewMock.mockClear();
    bbbScrollIntoViewMock.mockClear();

    // Scroll to 2
    expect(rootField.scrollToError(2)).toBe(null);
    expect(aaaScrollIntoViewMock).not.toHaveBeenCalled();
    expect(bbbScrollIntoViewMock).not.toHaveBeenCalled();
    aaaScrollIntoViewMock.mockClear();
    bbbScrollIntoViewMock.mockClear();

    // Scroll to -1
    expect(rootField.scrollToError(-1)).toBe(rootField.at('bbb'));
    expect(aaaScrollIntoViewMock).not.toHaveBeenCalled();
    expect(bbbScrollIntoViewMock).toHaveBeenCalledTimes(1);
    aaaScrollIntoViewMock.mockClear();
    bbbScrollIntoViewMock.mockClear();

    // Scroll to -2
    expect(rootField.scrollToError(-2)).toBe(rootField.at('aaa'));
    expect(aaaScrollIntoViewMock).toHaveBeenCalledTimes(1);
    expect(bbbScrollIntoViewMock).not.toHaveBeenCalled();
    aaaScrollIntoViewMock.mockClear();
    bbbScrollIntoViewMock.mockClear();

    // Scroll to -3
    expect(rootField.scrollToError(-3)).toBe(null);
    expect(aaaScrollIntoViewMock).not.toHaveBeenCalled();
    expect(bbbScrollIntoViewMock).not.toHaveBeenCalled();
    aaaScrollIntoViewMock.mockClear();
    bbbScrollIntoViewMock.mockClear();
  });

  test('scrolls to error at index with RTL text direction', () => {
    const rootField = createField({ aaa: 111, bbb: 222 }, composePlugins(errorsPlugin(), scrollToErrorPlugin()));

    const aaaElement = document.body.appendChild(document.createElement('input'));
    const bbbElement = document.body.appendChild(document.createElement('input'));

    rootField.at('aaa').ref(aaaElement);
    rootField.at('bbb').ref(bbbElement);

    jest.spyOn(aaaElement, 'getBoundingClientRect').mockImplementation(() => new DOMRect(100));
    jest.spyOn(bbbElement, 'getBoundingClientRect').mockImplementation(() => new DOMRect(200));

    const aaaScrollIntoViewMock = (aaaElement.scrollIntoView = jest.fn());
    const bbbScrollIntoViewMock = (bbbElement.scrollIntoView = jest.fn());

    act(() => {
      rootField.at('aaa').addError('error1');
      rootField.at('bbb').addError('error2');
    });

    // Scroll to 0
    rootField.scrollToError(0, { direction: 'rtl' });
    expect(aaaScrollIntoViewMock).not.toHaveBeenCalled();
    expect(bbbScrollIntoViewMock).toHaveBeenCalledTimes(1);
    aaaScrollIntoViewMock.mockClear();
    bbbScrollIntoViewMock.mockClear();

    // Scroll to 1
    rootField.scrollToError(1, { direction: 'rtl' });
    expect(aaaScrollIntoViewMock).toHaveBeenCalledTimes(1);
    expect(bbbScrollIntoViewMock).not.toHaveBeenCalled();
    aaaScrollIntoViewMock.mockClear();
    bbbScrollIntoViewMock.mockClear();
  });
});
