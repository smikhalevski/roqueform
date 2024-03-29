import { DoubterPlugin, doubterPlugin } from '@roqueform/doubter-plugin';
import * as d from 'doubter';
import { createField, Field } from 'roqueform';
import { expectType } from 'tsd';

const shape = d.object({ aaa: d.object({ bbb: d.string() }) });

expectType<Field<{ aaa: { bbb: string } }, DoubterPlugin>>(createField({ aaa: { bbb: 'aaa' } }, doubterPlugin(shape)));
