import { PubSub } from 'parallel-universe';
import { callOrGet, isEqual, publishEvents } from './utils.js';

declare const MIXIN: unique symbol;

type MIXIN = typeof MIXIN;

/**
 * The well-known events published by a {@link Field}.
 *
 * <dl>
 * <dt><i>"valueChanged"</i></dt>
 * <dd>The new value was set to the target field. The event payload contains the old value.</dd>
 *
 * <dt><i>"initialValueChanged"</i></dt>
 * <dd>The new initial value was set to the target field. The event payload contains the old initial value.</dd>
 *
 * <dt><i>"validityChanged"</i></dt>
 * <dd>The field's validity state has changed. The event payload contains the previous validity state.</dd>
 *
 * <dt><i>"errorAdded"</i></dt>
 * <dd>An error was added to a field. The event payload contains an error that was added.</dd>
 *
 * <dt><i>"errorCaught"</i></dt>
 * <dd>
 * An event type that notifies the errors plugin that an error must be added to a field. The event payload must contain
 * an error to add.
 * </dd>
 *
 * <dt><i>"errorDeleted"</i></dt>
 * <dd>An error was deleted from a field. The event payload contains an error that was deleted.</dd>
 *
 * <dt><i>"errorsCleared"</i></dt>
 * <dd>All errors were removed from the field. The event payload contains the previous array of errors.</dd>
 *
 * <dt><i>"annotationsChanged"</i></dt>
 * <dd>Field annotations were patched. The event payload contains the annotations before the patch was applied.</dd>
 *
 * <dt><i>"validationStarted"</i></dt>
 * <dd>The validation of the field has started. The event payload contains the validation that has started.</dd>
 *
 * <dt><i>"validationFinished"</i></dt>
 * <dd>The validation of the field has finished. The event payload contains the validation that has finished.</dd>
 * </dl>
 */
export type FieldEventType =
  | 'valueChanged'
  | 'initialValueChanged'
  | 'validityChanged'
  | 'errorAdded'
  | 'errorCaught'
  | 'errorDeleted'
  | 'errorsCleared'
  | 'annotationsChanged'
  | 'validationStarted'
  | 'validationFinished';

/**
 * The event published for subscribers of {@link Field a field}.
 *
 * @template Mixin The mixin added to the field.
 */
export interface FieldEvent<Mixin extends object = {}> {
  /**
   * The type of the event.
   */
  type: FieldEventType | (string & {});

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
 * The callback that constrains the value of the field and enhances it with a mixin. Plugin _can mutate_ the provided
 * field instance.
 *
 * @param field The mutable field that must be enhanced.
 * @template Value The field value required by the plugin.
 * @template Mixin The mixin that this plugin adds to the field.
 */
export type FieldPlugin<Value = any, Mixin extends object = {}> = {
  bivarianceHack(field: Field<Value, Mixin>): void;
}['bivarianceHack'];

/**
 * Reads and writes object properties.
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
 * Infers the value of the field.
 *
 * Use `InferValue<this>` in mixin interfaces to infer the value of the current field.
 *
 * @template T The field to infer value of.
 */
export type InferValue<T> = T extends Field ? T['value'] : never;

/**
 * Infers the mixin that was added to a field.
 *
 * Use `InferMixin<this>` in mixin interfaces to infer the intersection of all mixins of the current field.
 *
 * @template T The field to infer mixin of.
 */
export type InferMixin<T> = T extends Field ? T[MIXIN] : never;

/**
 * The field that manages a value and an associated data. Fields can be {@link FieldPlugin enhanced by plugins} that
 * provide integration with rendering frameworks, validation libraries, and other tools.
 *
 * @template Value The field value.
 * @template Mixin The mixin added to the field.
 */
export type Field<Value = any, Mixin extends object = {}> = FieldCore<Value, Mixin> & Mixin;

/**
 * Core properties of the {@link Field}.
 *
 * **Note:** It is recommended to use {@link Field} type whenever possible instead of {@link FieldCore}.
 *
 * @template Value The field value.
 * @template Mixin The mixin added to the field.
 */
export interface FieldCore<Value = any, Mixin extends object = {}> {
  /**
   * Holds the mixin type for inference.
   *
   * @internal
   * @private
   */
  readonly [MIXIN]: Mixin;

  /**
   * The parent field, or `null` if this is the root field.
   */
  readonly parentField: Field<any, Mixin> | null;

  /**
   * The array of child fields that were {@link at previously accessed}.
   */
  readonly children: readonly Field<any, Mixin>[];

  /**
   * The key in the {@link parentField parent value} that corresponds to the value of this field, or `null` if there's
   * no parent.
   */
  readonly key: any;

  /**
   * The initial value of the field.
   */
  initialValue: Value;

  /**
   * The current value of the field.
   */
  value: Value;

  /**
   * `true` if the value was last updated using {@link setTransientValue}, or `false` otherwise.
   *
   * @see [Transient updates](https://github.com/smikhalevski/roqueform#transient-updates)
   */
  readonly isTransient: boolean;

  /**
   * The accessor that reads and writes field values.
   *
   * @see [Accessors](https://github.com/smikhalevski/roqueform#accessors)
   */
  readonly valueAccessor: ValueAccessor;

  /**
   * Updates the field value and notifies both ancestors and child fields about the change. If the field withholds
   * {@link isTransient a transient value} then it becomes non-transient.
   *
   * @param value The value to set, or a callback that receives a previous value and returns a new one.
   * @see [Transient updates](https://github.com/smikhalevski/roqueform#transient-updates)
   */
  setValue(value: Value | ((prevValue: Value) => Value)): void;

  /**
   * Updates the value of the field, notifies child fields about the change, and marks value as
   * {@link isTransient transient}.
   *
   * @param value The value to set, or a callback that receives a previous value and returns a new one.
   * @see [Transient updates](https://github.com/smikhalevski/roqueform#transient-updates)
   */
  setTransientValue(value: Value | ((prevValue: Value) => Value)): void;

  /**
   * If {@link value the current value} {@link isTransient is transient} then the value of the parent field is notified
   * about the change and this field is marked as non-transient. No-op if the current value is non-transient.
   */
  flushTransient(): void;

  /**
   * Returns a child field that controls the value which is stored under the given key in
   * {@link value the current value}.
   *
   * @param key The key in the value of this field.
   * @param defaultValue The default value used if the value at given key is `undefined`.
   * @returns The child field instance.
   * @template Key The key in the value of this field.
   */
  at<Key extends KeyOf<Value>>(key: Key, defaultValue?: ValueAt<Value, Key>): Field<ValueAt<Value, Key>, Mixin>;

  /**
   * Publishes an event on this field and bubbles it to the parent field.
   *
   * @param event An event to publish.
   */
  publish(event: FieldEvent<Mixin>): void;

  /**
   * Subscribes the listener to events published by the field.
   *
   * @param listener The listener to subscribe.
   */
  subscribe(listener: (event: FieldEvent<Mixin>) => void): () => void;
}

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
  never;

/**
 * The value that corresponds to a key `K` in an object `T`, or `undefined` if there's no such key.
 */
// prettier-ignore
export type ValueAt<T, K> =
  T extends Primitive ? undefined :
  T extends { set(key: any, value: any): any, get(key: infer X): infer V } ? K extends X ? V : undefined :
  T extends { add(value: infer V): any, [Symbol.iterator]: Function } ? K extends number ? V | undefined : undefined :
  T extends ArrayLike<any> ? K extends number ? T[K] : undefined :
  T extends WeakSet<any> ? undefined :
  K extends keyof T ? T[K] :
  undefined;

/**
 * The baseline {@link Field} implementation.
 *
 * @internal
 */
export class FieldImpl implements FieldCore {
  declare [MIXIN]: {};

  value: any;
  isTransient = false;
  children: Field[] = [];
  _pubSub = new PubSub<FieldEvent>();

  constructor(
    public parentField: FieldImpl | null,
    public key: any,
    public initialValue: any,
    public valueAccessor: ValueAccessor,
    public _plugins: FieldPlugin[]
  ) {
    this.value = initialValue;
  }

  setValue = (value: unknown): void => {
    setValue(this, callOrGet(value, this.value), false);
  };

  setTransientValue = (value: unknown): void => {
    setValue(this, callOrGet(value, this.value), true);
  };

  flushTransient = (): void => {
    setValue(this, this.value, false);
  };

  at = (key: unknown, defaultValue?: unknown): Field => {
    for (const child of this.children) {
      if (isEqual(child.key, key)) {
        return child;
      }
    }

    const { valueAccessor, _plugins } = this;

    const initialValue = valueAccessor.get(this.initialValue, key);
    const value = valueAccessor.get(this.value, key);

    const field = new FieldImpl(this, key, initialValue, valueAccessor, _plugins);

    field.value = value !== undefined ? value : defaultValue;

    for (const plugin of _plugins) {
      plugin(field);
    }

    this.children.push(field);

    return field;
  };

  publish = (event: FieldEvent): void => {
    this._pubSub.publish(event);

    this.parentField?._pubSub.publish(event);
  };

  subscribe = (listener: (event: FieldEvent) => void): (() => void) => {
    return this._pubSub.subscribe(listener);
  };
}

function setValue(field: FieldImpl, value: unknown, isTransient: boolean): void {
  if (isEqual(field.value, value) && field.isTransient === isTransient) {
    return;
  }

  field.isTransient = isTransient;

  let root = field;

  while (root.parentField !== null && !root.isTransient) {
    value = root.parentField.valueAccessor.set(root.parentField.value, root.key, value);
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

    const childValue = target.valueAccessor.get(value, child.key);

    if (child !== relatedTarget && isEqual(child.value, childValue)) {
      continue;
    }

    propagateValue(child, relatedTarget, childValue, events);
  }

  return events;
}
