import { z } from 'zod';
import { expectAssignable } from 'tsd';
import { createField, Field } from 'roqueform';
import zodPlugin, { ZodMixin } from '@roqueform/zod-plugin';

const type = z.object({ aaa: z.object({ bbb: z.string() }) });

expectAssignable<Field<{ aaa: { bbb: string } }, ZodMixin>>(createField({ aaa: { bbb: 'aaa' } }, [zodPlugin(type)]));
