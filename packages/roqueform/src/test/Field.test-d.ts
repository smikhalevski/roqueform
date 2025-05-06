import { expectType, expectAssignable, expectNotAssignable } from 'tsd';
import { Field, FieldPlugin } from '../main/Field';
import { createField } from '../main/createField';

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
