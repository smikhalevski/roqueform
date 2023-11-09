import { z } from 'zod';
import { expectType } from 'tsd';
import { createField, Field } from 'roqueform';
import { ZodPlugin, zodPlugin } from '@roqueform/zod-plugin';

const shape = z.object({ foo: z.object({ bar: z.string() }) });

expectType<Field<ZodPlugin, { foo: { bar: string } }>>(createField({ foo: { bar: 'aaa' } }, zodPlugin(shape)));
