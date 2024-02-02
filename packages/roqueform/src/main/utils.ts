import type { Event, FieldBase } from './types';

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

/**
 * Dispatches events to appropriate subscribers.
 *
 * @param events The array of events to dispatch.
 */
export function dispatchEvents(events: readonly Event[]): void {
  for (const event of events) {
    if (event.type === '*') {
      continue;
    }

    for (let ancestor: FieldBase | null = event.targetField; ancestor !== null; ancestor = ancestor.parentField) {
      const subscribers1 = ancestor.subscribers[event.type];
      const subscribers2 = ancestor.subscribers['*'];

      if (subscribers1 !== undefined) {
        for (const subscriber of subscribers1) {
          subscriber(event);
        }
      }
      if (subscribers2 !== undefined) {
        for (const subscriber of subscribers2) {
          subscriber(event);
        }
      }
    }
  }
}
