import { Event, FieldController } from './typings';

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
 * If value is a function then it is called with the given argument, otherwise the value is returned as is.
 *
 * @param value The value to return or a callback to call.
 * @param arg The of argument to pass to the value callback.
 * @returns The value or the call result.
 * @template T The returned value.
 * @template A The value callback argument.
 */
export function callOrGet<T, A>(value: T | ((arg: A) => T), arg: A): T {
  return typeof value === 'function' ? (value as Function)(arg) : value;
}

/**
 * Creates the new event that would be dispatched from target field.
 *
 * @param type The type of the event.
 * @param target The target field from which the event is dispatched.
 * @param data The data carried by the event.
 */
export function createEvent<Target extends FieldController<any>, Data>(
  type: string,
  target: Target,
  data: Data
): Event<Target, Data> {
  return { type, currentTarget: target, target, data };
}

/**
 * Calls field subscribers that can handle given events.
 *
 * @param events The array of events to dispatch.
 */
export function dispatchEvents(events: readonly Event[]): void {
  for (const event of events) {
    for (let field = event.currentTarget; field !== null; field = field.parent) {
      const { subscribers } = field;

      if (subscribers === null) {
        continue;
      }

      event.currentTarget = field;

      const typeSubscribers = subscribers[event.type];
      const globSubscribers = subscribers['*'];

      if (typeSubscribers !== undefined) {
        for (const subscriber of typeSubscribers) {
          subscriber(event);
        }
      }
      if (globSubscribers !== undefined) {
        for (const subscriber of globSubscribers) {
          subscriber(event);
        }
      }
    }
  }
}
