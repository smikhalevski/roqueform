import { PubSub } from 'parallel-universe';
import { callOrGet, isEqual, publishEvents } from './utils.js';

declare const MIXIN: unique symbol;

type MIXIN = typeof MIXIN;

/**
 * Infers the value of the field.
 *
 * Use `InferValue<this>` in mixin interfaces to infer the value of the current field.
 *
 * @template T The field to infer value of.
 */
export type InferValue<T> = 'value' extends keyof T ? T['value'] : never;

/**
 * Infers the mixin that was added to a field.
 *
 * Use `InferMixin<this>` in mixin interfaces to infer the mixin of the current field.
 *
 * @template T The field to infer plugin of.
 */
export type InferMixin<T> = MIXIN extends keyof T ? T[MIXIN] : never;

/**
 * The event published for subscribers of {@link Field a field}.
 *
 * @template Mixin The mixin added to the field.
 */
export interface FieldEvent<Mixin = any> {
  /**
   * The type of the event.
   */
  type: string;

  /**
   * The field onto which this event was published.
   */
  target: Field<any, Mixin>;

  /**
   * The field that caused the event to be published.
   *
   * For example, if a parent field value is changed and the child field value is changed as the result. Then the change
   * event published on the child field would have {@link relatedTarget} set to the parent field.
   */
  relatedTarget: Field<any, Mixin> | null;

  /**
   * The payload carried by the event.
   */
  payload: any;
}

/**
 * Reads and write object properties.
 */
export interface ValueAccessor {
  /**
   * Returns the value that corresponds to key.
   *
   * @param obj An arbitrary object from which the value must be read. May be `undefined` or `null`.
   * @param key The key to read.
   * @returns The value that corresponds to the key.
   */
  get(obj: any, key: any): any;

  /**
   * Returns the object updated where the key is associated with the new value.
   *
   * @param obj The object to update. May be `undefined` or `null`.
   * @param key The key to write.
   * @param value The value to associate with the key.
   * @returns The updated object.
   */
  set(obj: any, key: any, value: any): any;
}

/**
 * The callback that constrains the value of the field and enhances it with a mixin. Plugin _can mutate_ the provided
 * field instance.
 *
 * @param field The mutable field that must be enhanced.
 * @template Value The field value required by the plugin.
 * @template Mixin The mixin that this plugin adds to the field.
 */
export type FieldPlugin<Value = any, Mixin = any> = (field: Field<Value, Mixin>) => void;

/**
 * The field that manages a value and an associated data. Fields can be {@link FieldPlugin enhanced by plugins} that
 * provide integration with rendering frameworks, validation libraries, and other tools.
 *
 * @template Value The field value.
 * @template Mixin The mixin added to the field.
 */
export type Field<Value = any, Mixin = any> = FieldImpl<Value, Mixin> & AnyToUnknown<Mixin>;

/**
 * Provides the core field functionality.
 *
 * @template Value The field value.
 * @template Mixin The mixin added to the field.
 */
export class FieldImpl<Value, Mixin> {
  /**
   * Holds the mixin type for inference.
   *
   * Use {@link InferMixin InferMixin<this>} in mixin interfaces to infer the mixin of the current field.
   *
   * @internal
   */
  declare readonly [MIXIN]: Mixin;

  /**
   * The current value of the field.
   */
  value: Value;

  /**
   * `true` if the value was last updated using {@link setTransientValue}, or `false` otherwise.
   *
   * @see [Transient updates](https://github.com/smikhalevski/roqueform#transient-updates)
   */
  isTransient = false;

  /**
   * The array of child fields that were {@link at previously accessed}.
   */
  readonly children: Field<any, Mixin>[] = [];

  /**
   * Publishes events to subscribers.
   */
  protected _pubSub = new PubSub<FieldEvent<Mixin>>();

  /**
   * @param key The key in the {@link parentField parent value} that corresponds to the value of this field, or `null`
   * if there's no parent.
   * @param parentField The parent field, or `null` if this is the root field.
   * @param initialValue The initial value of the field.
   * @param _valueAccessor The accessor that reads and writes field values.
   * @param _plugins The plugin injector that enhances children of this field.
   */
  constructor(
    readonly parentField: Field<any, Mixin> | null,
    readonly key: any,
    public initialValue: Value,

    /**
     * The accessor that reads and writes field values.
     *
     * @see [Accessors](https://github.com/smikhalevski/roqueform#accessors)
     */
    protected _valueAccessor: ValueAccessor,
    protected _plugins: readonly FieldPlugin[]
  ) {
    this.value = initialValue;
  }

  /**
   * Updates the field value and notifies both ancestors and child fields about the change. If the field withholds
   * {@link isTransient a transient value} then it becomes non-transient.
   *
   * @param value The value to set, or a callback that receives a previous value and returns a new one.
   * @see [Transient updates](https://github.com/smikhalevski/roqueform#transient-updates)
   */
  setValue = (value: Value | ((prevValue: Value) => Value)): void => {
    setValue(this, callOrGet(value, this.value), false);
  };

  /**
   * Updates the value of the field, notifies child fields about the change, and marks value as
   * {@link isTransient transient}.
   *
   * @param value The value to set, or a callback that receives a previous value and returns a new one.
   * @see [Transient updates](https://github.com/smikhalevski/roqueform#transient-updates)
   */
  setTransientValue = (value: Value | ((prevValue: Value) => Value)): void => {
    setValue(this, callOrGet(value, this.value), true);
  };

  /**
   * If {@link value the current value} {@link isTransient is transient} then the value of the parent field is notified
   * about the change and this field is marked as non-transient. No-op if the current value is non-transient.
   */
  flushTransient = (): void => {
    setValue(this, this.value, false);
  };

  /**
   * Returns a child field that controls the value which is stored under the given key in
   * {@link value the current value}.
   *
   * @param key The key in the value of this field.
   * @param defaultValue The default value used if the value at given key is `undefined`.
   * @returns The child field instance.
   * @template Key The key in the value of this field.
   */
  at<Key extends KeyOf<Value>>(key: Key, defaultValue?: ValueAt<Value, Key>): Field<ValueAt<Value, Key>, Mixin> {
    for (const child of this.children) {
      if (isEqual(child.key, key)) {
        return child;
      }
    }

    const { _valueAccessor, _plugins } = this;

    const initialValue = _valueAccessor.get(this.initialValue, key);
    const value = _valueAccessor.get(this.value, key);

    const field = new FieldImpl(this as Field, key, initialValue, _valueAccessor, _plugins) as Field<any, Mixin>;

    field.value = value !== undefined ? value : defaultValue;

    for (const plugin of _plugins) {
      plugin(field);
    }

    this.children.push(field);

    return field;
  }

  /**
   * Publishes an event on this field and bubbles it to the parent field.
   *
   * @param event An event to publish.
   */
  publish(event: FieldEvent<Mixin>): void {
    this._pubSub.publish(event);

    this.parentField?._pubSub.publish(event);
  }

  /**
   * Subscribes the listener to events published by the field.
   *
   * @param listener The listener to subscribe.
   */
  subscribe(listener: (event: FieldEvent<Mixin>) => void): () => void {
    return this._pubSub.subscribe(listener);
  }
}

function setValue(field: Field, value: unknown, isTransient: boolean): void {
  if (isEqual(field.value, value) && field.isTransient === isTransient) {
    return;
  }

  field.isTransient = isTransient;

  let root = field;

  while (root.parentField !== null && !root.isTransient) {
    value = root.parentField['_valueAccessor'].set(root.parentField.value, root.key, value);
    root = root.parentField;
  }

  publishEvents(propagateValue(root, field, value, []));
}

function propagateValue(target: Field, relatedTarget: Field, value: unknown, events: FieldEvent[]): FieldEvent[] {
  events.push({ type: 'valueChanged', target, relatedTarget, payload: target.value });

  target.value = value;

  for (const child of target.children) {
    if (child.isTransient) {
      continue;
    }

    const childValue = target['_valueAccessor'].get(value, child.key);

    if (child !== relatedTarget && isEqual(child.value, childValue)) {
      continue;
    }

    propagateValue(child, relatedTarget, childValue, events);
  }

  return events;
}

/**
 * Returns `unknown` if `T` is `any`, otherwise returns `T` as is.
 */
export type AnyToUnknown<T> = 0 extends 1 & T ? unknown : T;

type Primitive =
  | String
  | Number
  | Boolean
  | Symbol
  | Function
  | Date
  | RegExp
  | string
  | number
  | boolean
  | bigint
  | symbol
  | undefined
  | null;

/**
 * The union of all keys of `T`, or `never` if keys cannot be extracted.
 */
// prettier-ignore
export type KeyOf<T> =
  T extends Primitive ? never :
  T extends { set(key: any, value: any): any, get(key: infer K): any } ? K :
  T extends { add(value: any): any, [Symbol.iterator]: Function } ? number :
  T extends ArrayLike<any> ? number :
  T extends WeakSet<any> ? never :
  T extends object ? keyof T :
  never

/**
 * The value that corresponds to a `Key` in an object `T`, or `undefined` if there's no such key.
 */
// prettier-ignore
export type ValueAt<T, Key> =
  T extends Primitive ? undefined :
  T extends { set(key: any, value: any): any, get(key: infer K): infer V } ? Key extends K ? V : undefined :
  T extends { add(value: infer V): any, [Symbol.iterator]: Function } ? Key extends number ? V | undefined : undefined :
  T extends ArrayLike<any> ? Key extends number ? T[Key] : undefined :
  T extends WeakSet<any> ? undefined :
  Key extends keyof T ? T[Key] :
  undefined
