import { PubSub } from 'parallel-universe';
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

/**
 * Converts `k` to a number if it represents a valid array index, or returns -1 if `k` isn't an index.
 *
 * @see https://tc39.es/ecma262/multipage/ecmascript-data-types-and-values.html#array-index
 */
export function toArrayIndex(k: any): number {
  return (typeof k === 'number' || (typeof k === 'string' && k === '' + (k = +k))) && k >>> 0 === k ? k : -1;
}

export interface Ref<V> {
  (value: V): void;

  current: V;
}

export interface RefArray<V> extends Ref<V> {
  at(index: number): Ref<V>;

  toArray(): Ref<V>[];
}

export interface RefChangeEvent<V> {
  ref: ObservableRef<V>;
  prevValue: V;
  nextValue: V;
}

export interface ObservableRef<V> extends Ref<V> {
  _pubSub: PubSub<RefChangeEvent<V>>;

  _subscribe(listener: (event: RefChangeEvent<V>) => void): () => void;
}

export function createObservableRef<V>(initialValue: V): ObservableRef<V> {
  const ref: ObservableRef<V> = (value: V): void => {
    const prevValue = ref.current;

    if (prevValue === value) {
      return;
    }

    ref.current = value;

    ref._pubSub.publish({ ref, prevValue, nextValue: value });
  };

  ref.current = initialValue;

  ref._pubSub = new PubSub<RefChangeEvent<V>>();

  ref._subscribe = listener => ref._pubSub.subscribe(listener);

  return ref;
}

export interface ObservableRefArray<V> extends ObservableRef<V>, RefArray<V> {
  _refs: ObservableRef<V>[];

  at(index: number): ObservableRef<V>;
}

export function createObservableRefArray<V>(initialValue: V): ObservableRefArray<V> {
  const refArray = createObservableRef(initialValue) as ObservableRefArray<V>;

  refArray._refs = [refArray];

  refArray.at = index => {
    let ref = refArray._refs[index];

    if (ref === undefined) {
      ref = createObservableRef(initialValue);

      ref._subscribe(event => refArray._pubSub.publish(event));

      refArray._refs[index] = ref;
    }

    return ref;
  };

  refArray.toArray = () => refArray._refs.slice(0);

  return refArray;
}
