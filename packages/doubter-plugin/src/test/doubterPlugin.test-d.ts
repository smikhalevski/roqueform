import { annotationsPlugin, AnnotationsPlugin } from '@roqueform/annotations-plugin';
import { DoubterPlugin, doubterPlugin } from '@roqueform/doubter-plugin';
import * as d from 'doubter';
import { composePlugins, createField, Field } from 'roqueform';
import { expectType } from 'tsd';

const shape = d.object({ aaa: d.object({ bbb: d.string() }) });

expectType<Field<DoubterPlugin, { aaa: { bbb: string } }>>(createField({ aaa: { bbb: 'aaa' } }, doubterPlugin(shape)));

expectType<Field<AnnotationsPlugin<{ xxx: string }> & DoubterPlugin, { aaa: { bbb: string } }>>(
  createField({ aaa: { bbb: 'aaa' } }, composePlugins(doubterPlugin(shape), annotationsPlugin({ xxx: 'yyy' })))
);
