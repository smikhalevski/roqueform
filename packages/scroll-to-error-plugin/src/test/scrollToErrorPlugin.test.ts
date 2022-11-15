import { applyPlugins, createField, objectAccessor } from 'roqueform';
import { scrollToErrorPlugin } from '../main';
import { refPlugin } from '@roqueform/ref-plugin';
import { doubterPlugin } from '@roqueform/doubter-plugin';
import * as d from 'doubter';

describe('scrollToErrorPlugin', () => {
  const valueType = d.object({
    bar: d.number(),
  });

  const plugin = scrollToErrorPlugin(applyPlugins(doubterPlugin(valueType), refPlugin()));

  test('returns false if there are no errors', () => {
    const field = createField(objectAccessor, { bar: 111 }, plugin);

    expect(field.scrollToError()).toBe(false);
  });
});
