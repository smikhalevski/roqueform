import * as d from 'doubter';
import { expectType } from 'tsd';
import { createField, Field } from 'roqueform';
import { DoubterPlugin, doubterPlugin } from '@roqueform/doubter-plugin';

const shape = d.object({ foo: d.object({ bar: d.string() }) });

expectType<Field<{ foo: { bar: string } }, DoubterPlugin> & DoubterPlugin>(
  createField({ foo: { bar: 'aaa' } }, doubterPlugin(shape))
);
