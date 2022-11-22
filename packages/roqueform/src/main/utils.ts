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
 * Calls each callback from the list once with given set of arguments.
 *
 * If the list contains the same callback multiple times then the callback is called only once. If a callback throws an
 * error, the remaining callbacks are still called and the first occurred error is re-thrown in the end.
 *
 * @param callbacks The list of callbacks.
 * @param args The list of arguments to pass to each callback.
 * @template A The list of callback arguments.
 */
export function callAll<A extends any[]>(callbacks: Array<(...args: A) => any>, ...args: A): void {
  let errored = false;
  let error;

  for (let i = 0; i < callbacks.length; ++i) {
    const cb = callbacks[i];

    if (callbacks.indexOf(cb, i + 1) !== -1) {
      continue;
    }
    try {
      cb.apply(undefined, args);
    } catch (e) {
      if (!errored) {
        errored = true;
        error = e;
      }
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
