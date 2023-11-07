export function callOrGet<T>(value: T | ((prevValue: T) => T), prevValue: T): T {
  return typeof value === 'function' ? (value as Function)(prevValue) : value;
}

/**
 * [SameValueZero](https://262.ecma-international.org/7.0/#sec-samevaluezero) comparison operation.
 *
 * @param a The first value.
 * @param b The second value.
 * @returns `true` if provided values are equal, or `false` otherwise.
 */
export function isEqual(a: unknown, b: unknown): boolean {
  return a === b || (a !== a && b !== b);
}
