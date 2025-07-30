import { z } from 'zod';
import * as d from 'doubter';
import { expectAssignable } from 'tsd';
import { createField, Field } from '../../main/index.js';
import schemaPlugin, { SchemaMixin } from '../../main/plugin/schema.js';

const zodSchema = z.object({ aaa: z.object({ bbb: z.string() }) }).optional();
const doubterSchema = d.object({ aaa: d.object({ bbb: d.string() }) }).optional();

expectAssignable<Field<{ aaa: { bbb: string } } | undefined, SchemaMixin<typeof doubterSchema>>>(
  createField(undefined, [schemaPlugin(doubterSchema)])
);

expectAssignable<Field<{ aaa: { bbb: string } } | undefined, SchemaMixin<typeof doubterSchema>>>(
  createField(undefined, [schemaPlugin(zodSchema)])
);

createField(undefined, [schemaPlugin(doubterSchema)]).validate({ context: 'hello' });

createField(undefined, [schemaPlugin(zodSchema)]).validate();
