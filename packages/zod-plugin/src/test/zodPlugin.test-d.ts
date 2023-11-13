import { z } from 'zod';
import { expectType } from 'tsd';
import { createField, Field } from 'roqueform';
import { ZodPlugin, zodPlugin } from '@roqueform/zod-plugin';

const shape = z.object({ aaa: z.object({ bbb: z.string() }) });

expectType<Field<ZodPlugin, { aaa: { bbb: string } }>>(createField({ aaa: { bbb: 'aaa' } }, zodPlugin(shape)));
