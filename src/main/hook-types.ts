/**
 * A union of object keys.
 */
export type Key<O> = Internal.Key<O>;

/**
 * A union of all possible paths inside a deeply nested object.
 */
export type Path<O> = Internal.Path<O>;

export type ValueAtKey<O, K extends Key<O>> = Internal.ValueAtKey<O, K>;

export type ValueAtPath<O, P extends Path<O>> = Internal.ValueAtPath<O, P>;

/**
 * Prevents type widening on generic function parameters.
 */
export type Narrowed<T> = Internal.Narrowed<T>;

// @formatter:off
/**
 * @internal
 */
namespace Internal {

  /**
   * @internal
   */
  export type Key<O> =
    O extends Map<infer K, any> ? K :
    // O extends WeakMap<infer K, any> ? K :
    O extends Array<any> ? number :
    O extends object ? keyof O :
    never;

  /**
   * @internal
   */
  export type Path<O, P extends unknown[] = [], S = never> =
    O extends S ? P | [...P, ...unknown[]] :
    O extends Map<infer K, infer V> ? P | Path<V, [...P, K], S | O> :
    // O extends WeakMap<infer K, infer V> ? P | Path<V, [...P, K], S | O> :
    O extends Array<infer V> ? P | Path<V, [...P, number], S | O> :
    O extends object ? P | { [K in keyof O]-?: Path<O[K], [...P, K], S | O> }[keyof O] :
    P;

  /**
   * @internal
   */
  export type ValueAtKey<O, K> =
    O extends Map<infer X, infer V> ? K extends X ? V | undefined : never :
    // O extends WeakMap<infer X, infer V> ? K extends X ? V | undefined : never :
    O extends object ? K extends keyof O ? O[K] : never :
    O extends undefined | null ? undefined :
    never;

  /**
   * @internal
   */
  export type ValueAtPath<O, P extends unknown[]> =
    P extends readonly [] ? O :
    P extends readonly [infer K, ...infer P] ? ValueAtPath<ValueAtKey<O, K>, P extends Path<ValueAtKey<O, K>> ? P : never> :
    never;

  /**
   * @internal
   */
  type Cast<A, B> = A extends B ? A : B;

  /**
   * @internal
   */
  type Narrowable =
    | string
    | number
    | bigint
    | boolean;

  /**
   * @internal
   * @see https://github.com/microsoft/TypeScript/issues/30680#issuecomment-752725353
   */
  export type Narrowed<T> = Cast<T,
    | []
    | (T extends Narrowable ? T : never)
    | { [K in keyof T]: Narrowed<T[K]> }
  >;

}
// @formatter:on
