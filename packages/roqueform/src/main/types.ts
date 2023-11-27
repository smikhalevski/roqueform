/**
 * The field that manages a value and associated data. Fields can be {@link PluginInjector enhanced by plugins} that
 * provide integration with rendering frameworks, validation libraries, and other tools.
 *
 * @template Plugin The plugin injected into the field.
 * @template Value The field value.
 */
export type Field<Plugin = unknown, Value = any> = FieldController<Plugin, Value> & Plugin;

/**
 * The event dispatched to subscribers of {@link Field a field}.
 *
 * @template Plugin The plugin injected into the field.
 * @template Data The additional data related to the event.
 */
export interface Event<Plugin = any, Data = any> {
  /**
   * The type of the event.
   */
  type: string;

  /**
   * The field onto which this event was dispatched.
   */
  targetField: Field<Plugin>;

  /**
   * The field that caused this event to be dispatched onto the {@link targetField}.
   *
   * For example, if a child field value is changed and causes the change event to be dispatched for the parent field
   * as well, then the origin field is the child field for both change events.
   */
  originField: Field<Plugin>;

  /**
   * The {@link type type-specific} data related to the {@link targetField}.
   */
  data: Data;
}

/**
 * The callback that receives events dispatched by a {@link Field}.
 *
 * @param event The dispatched event.
 * @template Plugin The plugin injected into the field.
 * @template Data The additional data related to the event.
 */
export type Subscriber<Plugin = any, Data = any> = (event: Event<Plugin, Data>) => void;

/**
 * Unsubscribes the subscriber. No-op if subscriber was already unsubscribed.
 */
export type Unsubscribe = () => void;

/**
 * Infers plugins that were injected into a field
 *
 * Use `PluginOf<this>` in plugin interfaces to infer all plugin interfaces that were intersected with the field
 * controller.
 *
 * @template T The field to infer plugin of.
 */
export type PluginOf<T> = __PLUGIN__ extends keyof T ? T[__PLUGIN__] : unknown;

/**
 * Infers the value of the field.
 *
 * Use `ValueOf<this>` in plugin interfaces to infer the value of the current field.
 *
 * @template T The field to infer value of.
 */
export type ValueOf<T> = 'value' extends keyof T ? T['value'] : unknown;

/**
 * The field controller provides the core field functionality.
 *
 * @template Plugin The plugin injected into the field.
 * @template Value The field value.
 */
export interface FieldController<Plugin = unknown, Value = any> {
  /**
   * Holds the plugin type for inference.
   *
   * Use {@link PluginOf PluginOf<this>} in plugin interfaces to infer the plugin type.
   *
   * @hidden
   */
  readonly [__PLUGIN__]: Plugin;

  /**
   * The key in the {@link parentField parent value} that corresponds to the value of this field, or `null` if there's
   * no parent.
   */
  key: any;

  /**
   * The current value of the field.
   */
  value: Value;

  /**
   * The initial value of the field.
   */
  initialValue: Value;

  /**
   * `true` if the value was last updated using {@link setTransientValue}, or `false` otherwise.
   *
   * @see [Transient updates](https://github.com/smikhalevski/roqueform#transient-updates)
   */
  isTransient: boolean;

  /**
   * The root field.
   */
  rootField: Field<Plugin>;

  /**
   * The parent field, or `null` if this is the root field.
   */
  parentField: Field<Plugin> | null;

  /**
   * The array of child fields that were {@link at previously accessed}, or `null` if there are no children.
   */
  children: Field<Plugin>[] | null;

  /**
   * The map from an event type to an array of associated subscribers.
   */
  subscribers: { [eventType: string]: Subscriber<Plugin>[] };

  /**
   * The accessor that reads values of child fields from the value of this field, and updates the value of this field
   * when child value is changed.
   *
   * Child field inherit the parent field accessor when being accessed for the first time.
   *
   * @see [Accessors](https://github.com/smikhalevski/roqueform#accessors)
   */
  valueAccessor: ValueAccessor;

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
  propagate(): void;

  /**
   * Returns a child field that controls the value which is stored under the given key in
   * {@link value the current value}.
   *
   * @param key The key in the value of this field.
   * @returns The child field instance.
   * @template Key The key in the value of this field.
   */
  at<Key extends KeyOf<Value>>(key: Key): Field<Plugin, ValueAt<Value, Key>>;

  /**
   * Subscribes to all events.
   *
   * @param eventType The type of the event.
   * @param subscriber The subscriber that would be triggered.
   * @returns The callback to unsubscribe the subscriber.
   */
  on(eventType: '*', subscriber: Subscriber<Plugin>): Unsubscribe;

  /**
   * Subscribes to {@link value the field value} changes. {@link Event.data} contains the previous field value.
   *
   * @param eventType The type of the event.
   * @param subscriber The subscriber that would be triggered.
   * @returns The callback to unsubscribe the subscriber.
   */
  on(eventType: 'change:value', subscriber: Subscriber<Plugin>): Unsubscribe;
}

/**
 * The callback that enhances the field with a plugin. Injector should _mutate_ the passed field instance.
 *
 * @param field The mutable field that must be enhanced.
 * @template Plugin The plugin injected into the field.
 * @template Value The root field value.
 */
export type PluginInjector<Plugin = unknown, Value = any> = (field: Field<Plugin, Value>) => void;

/**
 * The abstraction used by the {@link Field} to read and write object properties.
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

export declare const __PLUGIN__: unique symbol;

export type __PLUGIN__ = typeof __PLUGIN__;

type Primitive =
  | String
  | Number
  | Boolean
  | BigInt
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
type KeyOf<T> =
  T extends Primitive ? never :
  T extends { set(key: any, value: any): any, get(key: infer K): any } ? K :
  T extends { add(value: any): any, [Symbol.iterator]: Function } ? number :
  T extends readonly any[] ? number :
  T extends object ? keyof T :
  never

/**
 * The value that corresponds to a `Key` in an object `T`, or `never` if there's no such key.
 */
// prettier-ignore
type ValueAt<T, Key> =
  T extends { set(key: any, value: any): any, get(key: infer K): infer V } ? Key extends K ? V : undefined :
  T extends { add(value: infer V): any, [Symbol.iterator]: Function } ? Key extends number ? V | undefined : undefined :
  T extends readonly any[] ? Key extends number ? T[Key] : undefined :
  Key extends keyof T ? T[Key] :
  undefined
