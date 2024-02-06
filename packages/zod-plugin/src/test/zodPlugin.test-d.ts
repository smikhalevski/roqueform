import { z } from 'zod';
import { expectType } from 'tsd';
import { createField, Field } from 'roqueform';
import { ZodPlugin, zodPlugin } from '@roqueform/zod-plugin';

const type = z.object({ aaa: z.object({ bbb: z.string() }) });

expectType<Field<{ aaa: { bbb: string } }, ZodPlugin>>(createField({ aaa: { bbb: 'aaa' } }, zodPlugin(type)));
