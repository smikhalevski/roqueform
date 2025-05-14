import { expectAssignable, expectNotAssignable, expectNotType, expectType } from 'tsd';
import { Field, FieldEvent } from '../main/index.js';
import { AnyToUnknown, KeyOf, ValueAt } from '../main/Field.js';

interface Aaa {
  aaa: string;
}

interface Bbb {
  bbb: number;
}

// Field

expectNotType<any>(null! as Field);

expectNotType<unknown>(null! as Field);

expectAssignable<Field<unknown>>(null! as Field);

expectAssignable<Field>(null! as Field<unknown>);

expectAssignable<Field>(null! as Field<unknown, Bbb>);

expectAssignable<Field<unknown>>(null! as Field<any, Bbb>);

expectAssignable<Field<Aaa>>(null! as Field<Aaa, Bbb>);

expectNotAssignable<Field<any, Bbb>>(null! as Field);

expectNotAssignable<Field<Aaa, Bbb>>(null! as Field<Aaa>);

expectNotAssignable<Field<Aaa>>(null! as Field<Bbb>);

// FieldEvent

expectAssignable<FieldEvent<unknown>>(null! as FieldEvent);

expectAssignable<FieldEvent>(null! as FieldEvent<unknown>);

// expectAssignable<FieldEvent>(null! as FieldEvent<unknown, Bbb>);
//
// expectAssignable<FieldEvent<unknown>>(null! as FieldEvent<any, Bbb>);
//
// expectAssignable<FieldEvent<Aaa>>(null! as FieldEvent<Aaa, Bbb>);
//
// // why?
// expectAssignable<FieldEvent<any, Bbb>>(null! as FieldEvent);
//
// // why?
// expectAssignable<FieldEvent<Aaa, Bbb>>(null! as FieldEvent<Aaa>);

expectNotAssignable<FieldEvent<Aaa>>(null! as FieldEvent<Bbb>);

// // why?
// expectAssignable<Subscriber<any, Bbb>>(null! as Subscriber);
//
// // why?
// expectAssignable<Subscriber<Aaa, Bbb>>(null! as Subscriber<Aaa>);
//
// expectNotAssignable<Subscriber<Aaa>>(null! as Subscriber<Bbb>);

// KeyOf

expectType<never>(null! as KeyOf<'aaa'>);

expectType<never>(null! as KeyOf<111>);

expectType<never>(null! as KeyOf<Date>);

expectType<never>(null! as KeyOf<RegExp>);

expectType<never>(null! as KeyOf<WeakSet<Aaa>>);

expectType<Aaa>(null! as KeyOf<WeakMap<Aaa, string>>);

expectType<number>(null! as KeyOf<boolean[]>);

expectType<'aaa' | 'bbb'>(null! as KeyOf<{ aaa: string; bbb: number }>);

expectType<'aaa' | 'bbb'>(null! as KeyOf<Aaa & Bbb>);

expectType<number>(null! as KeyOf<Set<string>>);

expectType<111 | 222>(null! as KeyOf<Map<111 | 222, object>>);

expectType<string>(null! as KeyOf<{ set(key: any, value: any): any; get(key: string): any }>);

expectType<number>(null! as KeyOf<{ add(value: any): any; [Symbol.iterator]: Function }>);

// ValueAt

expectType<undefined>(null! as ValueAt<'aaa', 'toString'>);

expectType<undefined>(null! as ValueAt<111, 'toString'>);

expectType<undefined>(null! as ValueAt<Date, 'now'>);

expectType<undefined>(null! as ValueAt<RegExp, 'test'>);

expectType<undefined>(null! as ValueAt<WeakSet<Aaa>, Aaa>);

expectType<undefined>(null! as ValueAt<WeakSet<Aaa>, 'add'>);

expectType<string | undefined>(null! as ValueAt<WeakMap<Aaa, string>, Aaa>);

expectType<undefined>(null! as ValueAt<WeakMap<Aaa, string>, Bbb>);

expectType<boolean>(null! as ValueAt<boolean[], 111>);

expectType<undefined>(null! as ValueAt<boolean[], '111'>);

expectType<string>(null! as ValueAt<{ aaa: string; bbb: number }, 'aaa'>);

expectType<number>(null! as ValueAt<{ aaa: string } & { bbb: number }, 'bbb'>);

expectType<number | boolean>(null! as ValueAt<{ aaa: number } | { aaa: boolean; bbb: string }, 'aaa'>);

expectType<string | undefined>(null! as ValueAt<{ aaa: number } | { aaa: boolean; bbb: string }, 'bbb'>);

expectType<undefined>(null! as ValueAt<{ aaa: string; bbb: number }, 'xxx'>);

expectType<string | undefined>(null! as ValueAt<Set<string>, 111>);

expectType<undefined>(null! as ValueAt<Set<string>, 'aaa'>);

expectType<Aaa | undefined>(null! as ValueAt<Map<111 | 222, Aaa>, 111>);

expectType<undefined>(null! as ValueAt<Map<111 | 222, Aaa>, 333>);

expectType<Aaa>(null! as ValueAt<{ set(key: any, value: any): any; get(key: string): Aaa }, 'aaa'>);

expectType<Aaa | undefined>(null! as ValueAt<{ add(value: Aaa): any; [Symbol.iterator]: Function }, 111>);

expectType<undefined>(null! as ValueAt<{ add(value: Aaa): any; [Symbol.iterator]: Function }, 'aaa'>);

// AnyToUnknown

expectType<unknown>(null! as AnyToUnknown<any>);

expectType<unknown>(null! as AnyToUnknown<unknown>);

expectType<Aaa>(null! as AnyToUnknown<Aaa>);
