/**
 * Removes readonly flag from object properties.
 *
 * @template T The object to make writable.
 */
export type Writable<T> = { -readonly [P in keyof T]: T[P] };

/**
 * If value is a function then it is called with the given set of arguments, otherwise the value is returned as is.
 *
 * @param value The value to return or a callback to call.
 * @param args The list of arguments to pass to a callback.
 * @returns The value or the call result.
 * @template T The returned value.
 * @template A The list of callback arguments.
 */
export function callOrGet<T, A extends any[]>(value: T | ((...args: A) => T), ...args: A): T {
  return typeof value === 'function' ? (value as Function)(...args) : value;
}

/**
 * Calls all callbacks from the list with given set of arguments. If a callback throw, the remaining callbacks are still
 * called and the last occurred error is thrown at the very end.
 *
 * @param callbacks The list of callbacks.
 * @param args The list of arguments to pass to each callback.
 * @template A The list of callback arguments.
 */
export function callAll<A extends any[]>(callbacks: Array<(...args: A) => any>, ...args: A): void {
  let errored = false;
  let error;

  for (const callback of callbacks) {
    try {
      callback.apply(undefined, args);
    } catch (e) {
      errored = true;
      error = e;
    }
  }
  if (errored) {
    throw error;
  }
}

/**
 * Referential equality checks that treats two `NaN` values as equal.
 *
 * @param a The first value.
 * @param b The second value.
 * @returns `true` if provided values are equal, or `false` otherwise.
 */
export function isEqual(a: unknown, b: unknown): boolean {
  return a === b || (a !== a && b !== b);
}
