import * as d from 'doubter';
import { expectType } from 'tsd';
import { createField, Field, objectAccessor } from 'roqueform';
import { DoubterMixin, doubterPlugin } from '../main';

const shape = d.object({ foo: d.object({ bar: d.string() }) });

expectType<Field<{ foo: { bar: string } }, DoubterMixin> & DoubterMixin>(
  createField(objectAccessor, { foo: { bar: 'aaa' } }, doubterPlugin(shape))
);
