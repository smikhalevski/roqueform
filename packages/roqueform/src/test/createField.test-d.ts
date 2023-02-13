import { expectType } from 'tsd';
import { createField, objectAccessor } from 'roqueform';

const field = createField<{ foo: { bar?: string } | null }>(objectAccessor, { foo: null });

expectType<{ bar?: string } | null>(field.at('foo').value);

expectType<string | undefined>(field.at('foo').at('bar').value);
