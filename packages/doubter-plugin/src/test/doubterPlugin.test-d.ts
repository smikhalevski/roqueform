import * as d from 'doubter';
import { expectType } from 'tsd';
import { createField, Field } from 'roqueform';
import { DoubterPlugin, doubterPlugin } from '@roqueform/doubter-plugin';

const shape = d.object({ aaa: d.object({ bbb: d.string() }) });

expectType<Field<DoubterPlugin, { aaa: { bbb: string } }>>(createField({ aaa: { bbb: 'aaa' } }, doubterPlugin(shape)));
