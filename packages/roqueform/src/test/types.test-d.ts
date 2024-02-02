import type { Event, Field, Subscriber } from 'roqueform';
import { expectAssignable, expectNotAssignable, expectNotType, expectType } from 'tsd';
import type { KeyOf, PreferUnknown, ValueAt } from '../main/types';

interface Aaa {
  aaa: string;
}

interface Bbb {
  bbb: number;
}

// Field

expectNotType<any>({} as Field);

expectNotType<unknown>({} as Field);

expectAssignable<Field<unknown>>({} as Field);

expectAssignable<Field>({} as Field<unknown>);

expectAssignable<Field>({} as Field<unknown, Bbb>);

expectAssignable<Field<unknown>>({} as Field<any, Bbb>);

expectAssignable<Field<Aaa>>({} as Field<Aaa, Bbb>);

expectNotAssignable<Field<any, Bbb>>({} as Field);

expectNotAssignable<Field<Aaa, Bbb>>({} as Field<Aaa>);

expectNotAssignable<Field<Aaa>>({} as Field<Bbb>);

// Event

expectAssignable<Event<unknown>>({} as Event);

expectAssignable<Event>({} as Event<unknown>);

expectAssignable<Event>({} as Event<unknown, Bbb>);

expectAssignable<Event<unknown>>({} as Event<any, Bbb>);

expectAssignable<Event<Aaa>>({} as Event<Aaa, Bbb>);

// why?
expectAssignable<Event<any, Bbb>>({} as Event);

// why?
expectAssignable<Event<Aaa, Bbb>>({} as Event<Aaa>);

expectNotAssignable<Event<Aaa>>({} as Event<Bbb>);

// Subscriber

expectAssignable<Subscriber<unknown>>({} as Subscriber);

expectAssignable<Subscriber>({} as Subscriber<unknown>);

expectAssignable<Subscriber>({} as Subscriber<unknown, Bbb>);

expectAssignable<Subscriber<unknown>>({} as Subscriber<any, Bbb>);

expectAssignable<Subscriber<Aaa>>({} as Subscriber<Aaa, Bbb>);

// why?
expectAssignable<Subscriber<any, Bbb>>({} as Subscriber);

// why?
expectAssignable<Subscriber<Aaa, Bbb>>({} as Subscriber<Aaa>);

expectNotAssignable<Subscriber<Aaa>>({} as Subscriber<Bbb>);

// KeyOf

expectType<never>({} as KeyOf<'aaa'>);

expectType<never>({} as KeyOf<111>);

expectType<never>({} as KeyOf<Date>);

expectType<never>({} as KeyOf<RegExp>);

expectType<never>({} as KeyOf<WeakSet<Aaa>>);

expectType<Aaa>({} as KeyOf<WeakMap<Aaa, string>>);

expectType<number>({} as KeyOf<boolean[]>);

expectType<'aaa' | 'bbb'>({} as KeyOf<{ aaa: string; bbb: number }>);

expectType<'aaa' | 'bbb'>({} as KeyOf<Aaa & Bbb>);

expectType<number>({} as KeyOf<Set<string>>);

expectType<111 | 222>({} as KeyOf<Map<111 | 222, object>>);

expectType<string>({} as KeyOf<{ set(key: any, value: any): any; get(key: string): any }>);

expectType<number>({} as KeyOf<{ add(value: any): any; [Symbol.iterator]: Function }>);

// ValueAt

expectType<undefined>(undefined as ValueAt<'aaa', 'toString'>);

expectType<undefined>(undefined as ValueAt<111, 'toString'>);

expectType<undefined>(undefined as ValueAt<Date, 'now'>);

expectType<undefined>(undefined as ValueAt<RegExp, 'test'>);

expectType<undefined>(undefined as ValueAt<WeakSet<Aaa>, Aaa>);

expectType<undefined>(undefined as ValueAt<WeakSet<Aaa>, 'add'>);

expectType<string | undefined>({} as ValueAt<WeakMap<Aaa, string>, Aaa>);

expectType<undefined>(undefined as ValueAt<WeakMap<Aaa, string>, Bbb>);

expectType<boolean>({} as ValueAt<boolean[], 111>);

expectType<undefined>(undefined as ValueAt<boolean[], '111'>);

expectType<string>({} as ValueAt<{ aaa: string; bbb: number }, 'aaa'>);

expectType<number>({} as ValueAt<{ aaa: string } & { bbb: number }, 'bbb'>);

expectType<number | boolean>({} as ValueAt<{ aaa: number } | { aaa: boolean; bbb: string }, 'aaa'>);

expectType<string | undefined>(undefined as ValueAt<{ aaa: number } | { aaa: boolean; bbb: string }, 'bbb'>);

expectType<undefined>(undefined as ValueAt<{ aaa: string; bbb: number }, 'xxx'>);

expectType<string | undefined>({} as ValueAt<Set<string>, 111>);

expectType<undefined>(undefined as ValueAt<Set<string>, 'aaa'>);

expectType<Aaa | undefined>({} as ValueAt<Map<111 | 222, Aaa>, 111>);

expectType<undefined>(undefined as ValueAt<Map<111 | 222, Aaa>, 333>);

expectType<Aaa>({} as ValueAt<{ set(key: any, value: any): any; get(key: string): Aaa }, 'aaa'>);

expectType<Aaa | undefined>({} as ValueAt<{ add(value: Aaa): any; [Symbol.iterator]: Function }, 111>);

expectType<undefined>(undefined as ValueAt<{ add(value: Aaa): any; [Symbol.iterator]: Function }, 'aaa'>);

// PreferUnknown

expectType<unknown>({} as PreferUnknown<any>);

expectType<unknown>({} as PreferUnknown<unknown>);

expectType<Aaa>({} as PreferUnknown<Aaa>);
