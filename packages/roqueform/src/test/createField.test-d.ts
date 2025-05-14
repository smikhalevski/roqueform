import { expectAssignable, expectNotAssignable, expectType } from 'tsd';
import { createField, Field, FieldPlugin } from '../main/index.js';

expectType<Field<string, { xxx: 111 } & { yyy: 222 } & { zzz: 333 }>>(
  createField('aaa', [
    null! as FieldPlugin<any, { xxx: 111 }>,
    null! as FieldPlugin<any, { yyy: 222 }>,
    null! as FieldPlugin<any, { zzz: 333 }>,
  ])
);

expectType<Field<'aaa' | 'bbb'>>(
  createField('aaa', [
    null! as FieldPlugin<'aaa' | 'bbb' | 'xxx'>,
    null! as FieldPlugin<'aaa' | 'bbb' | 'yyy'>,
    null! as FieldPlugin<'aaa' | 'bbb' | 'zzz'>,
  ])
);

expectType<Field<'aaa' | 'bbb', { xxx: 111 } & { yyy: 222 }>>(
  createField('aaa', [
    null! as FieldPlugin<'aaa' | 'bbb' | 'ddd', { xxx: 111 }>,
    null! as FieldPlugin<'aaa' | 'bbb' | 'ccc', { yyy: 222 }>,
  ])
);

expectType<Field<string>>(createField('aaa'));

expectType<Field<string>>(createField('aaa', []));

expectType<Field<string>>(createField('aaa', [null! as FieldPlugin]));

expectAssignable<Field>(createField('aaa', [null! as FieldPlugin<string, { xxx: 111 }>]));

expectAssignable<Field<string>>(createField('aaa', [null! as FieldPlugin<any, { xxx: 111 }>]));

expectNotAssignable<Field<'aaa'>>(createField('aaa', [null! as FieldPlugin<any, { xxx: 111 }>]));

expectNotAssignable<Field<number>>(createField('aaa', [null! as FieldPlugin<any, { xxx: 111 }>]));

// prettier-ignore
expectType<never>(
  createField('aaa', [
    null! as FieldPlugin<any, { xxx: 111 }>,
    null! as FieldPlugin<any, { xxx: 222 }>,
  ])
);

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
