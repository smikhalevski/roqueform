import { Event } from './typings';

export function callOrGet<T, A>(value: T | ((prevValue: A) => T), prevValue: A): T {
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

export function dispatchEvents(events: readonly Event[]): void {
  for (const event of events) {
    const { subscribers } = event.target;

    if (subscribers !== null) {
      callAll(subscribers[event.type], event);
      callAll(subscribers['*'], event);
    }
  }
}

function callAll(subscribers: Array<(event: Event) => void> | undefined, event: Event): void {
  if (subscribers !== undefined) {
    for (const subscriber of subscribers) {
      try {
        subscriber(event);
      } catch (error) {
        setTimeout(() => {
          throw error;
        }, 0);
      }
    }
  }
}
