// @formatter:off
/**
 * A union of object keys.
 */
export type KeyOf<O> =
  O extends Map<infer K, any> ? K :
  O extends Array<any> ? number :
  O extends object ? keyof O :
  never;

/**
 * A union of all possible paths inside a deeply nested object.
 */
export type ObjectPath<O> = OpenEndedObjectPath<O>;

export type ValueAtKey<O, K extends KeyOf<O>> = ValueAtUncheckedKey<O, K>;

export type ValueAtPath<O, P extends ObjectPath<O>> = ValueAtUncheckedPath<O, P>;

/**
 * Prevents type widening on generic function parameters.
 *
 * @see https://github.com/microsoft/TypeScript/issues/30680#issuecomment-752725353
 */
export type Narrowed<T> =
  | (T extends [] ? [] : never)
  | (T extends string | number | boolean | bigint | symbol ? T : never)
  | { [K in keyof T]: Narrowed<T[K]> };

/**
 * @internal
 */
type OpenEndedObjectPath<O, P extends unknown[] = [], S = never> =
  O extends S ? P | [...P, ...unknown[]] :
  O extends Map<infer K, infer V> ? P | OpenEndedObjectPath<V, [...P, K], S | O> :
  O extends Array<infer V> ? P | OpenEndedObjectPath<V, [...P, number], S | O> :
  O extends object ? P | { [K in keyof O]-?: OpenEndedObjectPath<O[K], [...P, K], S | O> }[keyof O] :
  P;

/**
 * @internal
 */
type ValueAtUncheckedKey<O, K> =
  O extends Map<infer X, infer V> ? K extends X ? V | undefined : never :
  O extends object ? K extends keyof O ? O[K] : never :
  O extends undefined | null ? undefined :
  never;

/**
 * @internal
 */
type ValueAtUncheckedPath<O, P extends unknown[]> =
  P extends readonly [] ? O :
  P extends readonly [infer K, ...infer P] ? ValueAtUncheckedPath<ValueAtUncheckedKey<O, K>, P extends OpenEndedObjectPath<ValueAtUncheckedKey<O, K>> ? P : never> :
  never;
