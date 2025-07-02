import { FieldEvent } from './FieldImpl.js';

export const emptyObject = {};

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

/**
 * If value is a function then it is called, otherwise the value is returned as is.
 *
 * @param value The value to return or a callback to call.
 * @returns The value or the call result.
 * @template T The returned value.
 */
export function callOrGet<T>(value: T | (() => T)): T;

/**
 * If value is a function then it is called with the given argument, otherwise the value is returned as is.
 *
 * @param value The value to return or a callback to call.
 * @param arg The of argument to pass to the value callback.
 * @returns The value or the call result.
 * @template T The returned value.
 * @template A The value callback argument.
 */
export function callOrGet<T, A>(value: T | ((arg: A) => T), arg: A): T;

export function callOrGet(value: unknown, arg?: unknown) {
  return typeof value !== 'function' ? value : arguments.length === 1 ? value() : value(arg);
}

export function AbortError(message: string): Error {
  return typeof DOMException !== 'undefined' ? new DOMException(message, 'AbortError') : Error(message);
}

/**
 * Converts `k` to a number if it represents a valid array index, or returns -1 if `k` isn't an index.
 *
 * @see https://tc39.es/ecma262/multipage/ecmascript-data-types-and-values.html#array-index
 */
export function toArrayIndex(k: any): number {
  return (typeof k === 'number' || (typeof k === 'string' && k === '' + (k = +k))) && k >>> 0 === k ? k : -1;
}

/**
 * Publishes events to corresponding targets.
 */
export function publishEvents(events: FieldEvent[]): void {
  for (const event of events) {
    event.target.publish(event);
  }
}

/**
 * Defines getter for object property that receives the value returned from the previously defined getter.
 */
export function overrideReadonlyProperty<T, K extends keyof T>(
  obj: T,
  key: K,
  get: (value: T[K] | undefined) => T[K]
): void {
  const prevDescriptor = Object.getOwnPropertyDescriptor(obj, key);

  Object.defineProperty(obj, key, {
    configurable: true,

    get:
      prevDescriptor === undefined
        ? () => get(undefined)
        : () => get(prevDescriptor.get === undefined ? prevDescriptor.value : prevDescriptor.get.call(obj)),
  });
}
