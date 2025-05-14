/**
 * @vitest-environment jsdom
 */

import { expect, test, vi } from 'vitest';
import { act } from '@testing-library/react';
import { createField } from '../../main/index.js';
import scrollToErrorPlugin from '../../main/plugin/scroll-to-error.js';
import errorsPlugin from '../../main/plugin/errors.js';

test('returns null if there are no errors', () => {
  const field = createField({ aaa: 111 }, [scrollToErrorPlugin()]);

  expect(field.scrollToError()).toBe(null);
});

test('scrolls to error at index with LTR text direction', () => {
  const rootField = createField({ aaa: 111, bbb: 222 }, [errorsPlugin(), scrollToErrorPlugin()]);

  const aaaElement = document.body.appendChild(document.createElement('input'));
  const bbbElement = document.body.appendChild(document.createElement('input'));

  rootField.at('aaa').ref(aaaElement);
  rootField.at('bbb').ref(bbbElement);

  const aaaScrollIntoViewMock = (aaaElement.scrollIntoView = vi.fn());
  const bbbScrollIntoViewMock = (bbbElement.scrollIntoView = vi.fn());

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
