import * as d from 'doubter';
import { expectError, expectType } from 'tsd';
import { createField, Field, objectAccessor } from 'roqueform';
import { DoubterMixin, doubterPlugin } from '../main';

const shape = d.object({ foo: d.object({ bar: d.string() }) });

expectType<Field<{ foo: { bar: string } }, DoubterMixin> & DoubterMixin>(
  createField(objectAccessor, { foo: { bar: 'aaa' } }, doubterPlugin(shape))
);

expectError(createField(objectAccessor, { foo: { bar: 111 } }, doubterPlugin(shape)));
