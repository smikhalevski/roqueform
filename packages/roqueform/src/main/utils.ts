import { FieldEvent } from './Field.js';

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

export function publishEvents(events: FieldEvent[]): void {
  for (const event of events) {
    event.target.publish(event);
  }
}
