/**
 * @vitest-environment jsdom
 */

import { expect, test, vi } from 'vitest';
import { createField } from '../../main/index.js';
import refPlugin from '../../main/plugin/ref.js';

test('preserves the ref from preceding plugin', () => {
  const refMock = vi.fn();

  const field = createField({ aaa: 111 }, [field => Object.assign(field, { ref: refMock }), refPlugin()]);

  field.ref(document.body);

  expect(refMock).toHaveBeenCalledTimes(1);
  expect(refMock).toHaveBeenNthCalledWith(1, document.body);
});
