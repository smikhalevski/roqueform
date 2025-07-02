import doubterPlugin, { DoubterMixin } from '@roqueform/doubter-plugin';
import * as d from 'doubter';
import { createField, Field } from 'roqueform';
import { expectAssignable } from 'tsd';

const shape = d.object({ aaa: d.object({ bbb: d.string() }) });

expectAssignable<Field<{ aaa: { bbb: string } }, DoubterMixin>>(
  createField({ aaa: { bbb: 'aaa' } }, [doubterPlugin(shape)])
);
