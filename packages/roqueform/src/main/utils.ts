import { FieldEvent } from './typings';

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

export function dispatchEvents<E extends FieldEvent<any>>(events: readonly E[]): void {
  for (const event of events) {
    const { listeners } = event.currentTarget;

    if (listeners !== null) {
      callAll(listeners[event.type], event);
      callAll(listeners['*'], event);
    }
  }
}

function callAll(listeners: Array<(event: FieldEvent) => void> | undefined, event: FieldEvent): void {
  if (listeners !== undefined) {
    for (const listener of listeners) {
      try {
        listener(event);
      } catch (error) {
        setTimeout(() => {
          throw error;
        }, 0);
      }
    }
  }
}
