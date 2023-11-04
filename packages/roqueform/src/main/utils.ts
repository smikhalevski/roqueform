/**
 * If value is a function then it is called, otherwise the value is returned as is.
 *
 * @param value The value to return or a callback to call.
 * @returns The value or the call result.
 * @template T The returned value.
 */
export function callOrGet<T>(value: T | (() => T)): T;

/**
 * If value is a function then it is called with the given set of arguments, otherwise the value is returned as is.
 *
 * @param value The value to return or a callback to call.
 * @param args The array of arguments to pass to a callback.
 * @returns The value or the call result.
 * @template T The returned value.
 * @template A The array of callback arguments.
 */
export function callOrGet<T, A extends any[]>(value: T | ((...args: A) => T), args: A): T;

export function callOrGet(value: unknown, args?: unknown[]) {
  return typeof value === 'function' ? value.apply(undefined, args) : value;
}

/**
 * Calls each callback from the array.
 *
 * If the array contains the same callback multiple times then the callback is called only once. If a callback throws an
 * error, the remaining callbacks are still called and the error is re-thrown asynchronously.
 *
 * @param callbacks The array of callbacks.
 */
export function callAll(callbacks: Array<() => any>): void;

/**
 * Calls each callback from the array with given set of arguments.
 *
 * If the array contains the same callback multiple times then the callback is called only once. If a callback throws an
 * error, the remaining callbacks are still called and the error is re-thrown asynchronously.
 *
 * @param callbacks The array of callbacks.
 * @param args The array of arguments to pass to each callback.
 * @template A The array of callback arguments.
 */
export function callAll<A extends any[]>(callbacks: Array<(...args: A) => any>, args: A): void;

export function callAll(callbacks: Function[], args?: unknown[]): void {
  for (let i = 0; i < callbacks.length; ++i) {
    const cb = callbacks[i];

    if (callbacks.lastIndexOf(cb) !== i) {
      continue;
    }
    try {
      cb.apply(undefined, args);
    } catch (error) {
      setTimeout(() => {
        throw error;
      }, 0);
    }
  }
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
