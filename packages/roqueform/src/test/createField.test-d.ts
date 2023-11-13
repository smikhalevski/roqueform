import { expectType } from 'tsd';
import { createField } from 'roqueform';

// Optional properties

const field1 = createField<{ aaa: { bbb?: string } | null }>({ aaa: null });

expectType<{ bbb?: string } | null>(field1.at('aaa').value);

expectType<string | undefined>(field1.at('aaa').at('bbb').value);

// Unions

type Field2Value = { aaa: number } | { aaa: boolean; bbb: string };

const field2 = createField<Field2Value>({ aaa: 111 });

expectType<number | boolean>(field2.at('aaa').value);

expectType<string | undefined>(field2.at('bbb').value);

// Map

expectType<string | undefined>(createField<Map<'bbb', string>>(new Map()).at('bbb').value);

// Set

expectType<string | undefined>(createField<Set<string>>(new Set()).at(111).value);

// Array

expectType<string>(createField<string[]>(['aaa', 'bbb']).at(1).value);

// Tuple

expectType<string>(createField<[string, number]>(['aaa', 111]).at(0).value);

expectType<number>(createField<[string, number]>(['aaa', 111]).at(1).value);

expectType<undefined>(createField<[string, number]>(['aaa', 111]).at(2).value);

expectType<string | number>(createField<[string, number]>(['aaa', 111]).at(222 as number).value);
