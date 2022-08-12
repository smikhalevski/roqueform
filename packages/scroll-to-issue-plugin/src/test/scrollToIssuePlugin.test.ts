import { applyPlugins, createField, objectAccessor } from 'roqueform';
import { scrollToIssuePlugin } from '../main';
import { refPlugin } from '@roqueform/ref-plugin';
import { doubterPlugin } from '@roqueform/doubter-plugin';
import * as d from 'doubter';

describe('scrollToIssuePlugin', () => {
  const valueType = d.object({
    bar: d.number(),
  });

  const plugin = scrollToIssuePlugin(applyPlugins(doubterPlugin(valueType), refPlugin()));

  test('returns false if there are no issues', () => {
    const field = createField(objectAccessor, { bar: 111 }, plugin);

    expect(field.scrollToIssue()).toBe(false);
  });
});
