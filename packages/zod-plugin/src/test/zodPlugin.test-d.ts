import { z } from 'zod';
import { expectType } from 'tsd';
import { createField, Field } from 'roqueform';
import { ZodMixin, zodPlugin } from '@roqueform/zod-plugin';

const shape = z.object({ foo: z.object({ bar: z.string() }) });

expectType<Field<{ foo: { bar: string } }, ZodMixin> & ZodMixin>(
  createField({ foo: { bar: 'aaa' } }, zodPlugin(shape))
);
