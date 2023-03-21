import { expectType } from 'tsd';
import { createField } from 'roqueform';

// Optional properties

const field1 = createField<{ foo: { bar?: string } | null }>({ foo: null });

expectType<{ bar?: string } | null>(field1.at('foo').value);

expectType<string | undefined>(field1.at('foo').at('bar').value);

// Unions

type Field2Value = { aaa: number } | { aaa: boolean; bbb: string };

const field2 = createField<Field2Value>({ aaa: 111 });

expectType<number | boolean>(field2.at('aaa').value);

expectType<string | undefined>(field2.at('bbb').value);
