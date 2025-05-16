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

export interface ObservableRefChangeEvent<V> {
  target: ObservableRef<V>;
  prevValue: V;
  nextValue: V;
}

export class ObservableRef<V> {
  protected _value: V;
  protected _pubSub = new PubSub<ObservableRefChangeEvent<V>>();

  constructor(initialValue: V) {
    this._value = initialValue;
  }

  get current(): V {
    return this._value;
  }

  set current(value: V) {
    const prevValue = this._value;

    if (prevValue === value) {
      return;
    }

    this._value = value;
    this._pubSub.publish({ target: this, prevValue, nextValue: value });
  }

  subscribe(listener: (event: ObservableRefChangeEvent<V>) => void): () => void {
    return this._pubSub.subscribe(listener);
  }
}

export class ObservableRefArray<V> extends ObservableRef<V> implements ArrayLike<ObservableRef<V>> {
  readonly [index: number]: ObservableRef<V>;

  protected _refs: ObservableRef<V>[] = [];

  constructor(initialValue: V) {
    super(initialValue);

    new Proxy(this, observableRefArrayProxyHandler);
  }

  get length(): number {
    return this._refs.length;
  }

  get current(): V {
    return this[0].current;
  }

  set current(value: V) {
    this[0].current = value;
  }

  toArray(): ObservableRef<V>[] {
    return this._refs.slice(0);
  }
}

function toArrayIndex(k: any): number {
  return typeof k === 'string' && k === '' + (k = +k) && k >>> 0 === k ? k : -1;
}

const observableRefArrayProxyHandler: ProxyHandler<ObservableRefArray<any>> = {
  get(target, k: any) {
    if (k in target) {
      return target[k];
    }

    const index = toArrayIndex(k);

    if (index === -1) {
      return undefined;
    }

    let ref = target['_refs'][index];

    if (ref === undefined) {
      ref = target['_refs'][index] = new ObservableRef(target['_value']);

      ref.subscribe(event => target['_pubSub'].publish(event));
    }

    return ref;
  },
};
