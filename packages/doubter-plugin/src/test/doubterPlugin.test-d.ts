import { annotationsPlugin, AnnotationsPlugin } from '@roqueform/annotations-plugin';
import { DoubterPlugin, doubterPlugin } from '@roqueform/doubter-plugin';
import * as d from 'doubter';
import { composePlugins, createField, Field } from 'roqueform';
import { expectType } from 'tsd';

const shape = d.object({ aaa: d.object({ bbb: d.string() }) });

expectType<Field<{ aaa: { bbb: string } }, DoubterPlugin>>(createField({ aaa: { bbb: 'aaa' } }, doubterPlugin(shape)));

expectType<Field<{ aaa: { bbb: string } }, AnnotationsPlugin<{ xxx: string }> & DoubterPlugin>>(
  createField({ aaa: { bbb: 'aaa' } }, composePlugins(doubterPlugin(shape), annotationsPlugin({ xxx: 'yyy' })))
);
