/**
 * The field that manages a value and an associated data. Fields can be {@link PluginInjector enhanced by plugins} that
 * provide integration with rendering frameworks, validation libraries, and other tools.
 *
 * @template Value The field value.
 * @template Plugin The plugin injected into the field.
 */
export type Field<Value = any, Plugin = any> = BareField<Value, PreferAny<Plugin>> & PreferUnknown<Plugin>;

/**
 * The bare field provides the core field functionality.
 *
 * @template Value The field value.
 * @template Plugin The plugin injected into the field.
 */
export interface BareField<Value = any, Plugin = any> {
  /**
   * Holds the plugin type for inference.
   *
   * Use {@link PluginOf PluginOf<this>} in plugin interfaces to infer the plugin type.
   *
   * @hidden
   * @internal
   */
  readonly [__plugin]: Plugin;

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
  rootField: Field<any, Plugin>;

  /**
   * The parent field, or `null` if this is the root field.
   */
  parentField: Field<any, Plugin> | null;

  /**
   * The array of child fields that were {@link at previously accessed}, or `null` if there are no children.
   */
  children: Field<any, Plugin>[] | null;

  /**
   * The map from an event type to an array of associated subscribers.
   */
  subscribers: { [eventType: string]: Subscriber<any, Plugin>[] };

  /**
   * The accessor that reads values of child fields from {@link Field.value the value of this field}, and updates the
   * value of this field when child value is changed.
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
   * @param defaultValue The default value used if the value at given key is `undefined`.
   * @returns The child field instance.
   * @template Key The key in the value of this field.
   */
  at<Key extends KeyOf<Value>>(key: Key, defaultValue?: ValueAt<Value, Key>): Field<ValueAt<Value, Key>, Plugin>;

  /**
   * Subscribes to all events.
   *
   * @param eventType The type of the event.
   * @param subscriber The subscriber that would be triggered.
   * @returns The callback to unsubscribe the subscriber.
   */
  on(eventType: '*', subscriber: Subscriber<any, Plugin>): Unsubscribe;

  /**
   * Subscribes to {@link value the field value} changes. {@link Event.data} contains the previous field value.
   *
   * @param eventType The type of the event.
   * @param subscriber The subscriber that would be triggered.
   * @returns The callback to unsubscribe the subscriber.
   */
  on(eventType: 'change:value', subscriber: Subscriber<any, Plugin>): Unsubscribe;
}

/**
 * The event dispatched to subscribers of {@link Field a field}.
 *
 * @template Data The additional data related to the event.
 * @template Plugin The plugin injected into the field.
 */
export interface Event<Data = any, Plugin = any> {
  /**
   * The type of the event.
   */
  type: string;

  /**
   * The field onto which this event was dispatched.
   */
  targetField: Field<any, Plugin>;

  /**
   * The field that caused this event to be dispatched onto the {@link targetField}.
   *
   * For example, if a child field value is changed and causes the change event to be dispatched for the parent field
   * as well, then the origin field is the child field for both change events.
   */
  originField: Field<any, Plugin>;

  /**
   * The {@link type type-specific} data related to the {@link targetField}.
   */
  data: Data;
}

/**
 * The callback that receives events dispatched by a {@link Field}.
 *
 * @param event The dispatched event.
 * @template Data The additional data related to the event.
 * @template Plugin The plugin injected into the field.
 */
export type Subscriber<Data = any, Plugin = any> = (event: Event<Data, Plugin>) => void;

/**
 * Unsubscribes the subscriber. No-op if subscriber was already unsubscribed.
 */
export type Unsubscribe = () => void;

/**
 * Infers plugins that were injected into a field
 *
 * Use `PluginOf<this>` in plugin interfaces to infer all plugin interfaces that were intersected with the bare field.
 *
 * @template T The field to infer plugin of.
 */
export type PluginOf<T> = __plugin extends keyof T ? T[__plugin] : any;

/**
 * Infers the value of the field.
 *
 * Use `ValueOf<this>` in plugin interfaces to infer the value of the current field.
 *
 * @template T The field to infer value of.
 */
export type ValueOf<T> = 'value' extends keyof T ? T['value'] : any;

/**
 * The callback that enhances the field with a plugin. Injector should _mutate_ the passed field instance.
 *
 * @param field The mutable field that must be enhanced.
 * @template Plugin The plugin injected into the field.
 * @template Value The root field value.
 */
export type PluginInjector<Plugin = unknown, Value = unknown> = (field: Field<PreferAny<Value>, Plugin>) => void;

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

declare const __plugin: unique symbol;

export type __plugin = typeof __plugin;

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

type OpaqueObject = WeakSet<any>;

/**
 * The union of all keys of `T`, or `never` if keys cannot be extracted.
 */
// prettier-ignore
export type KeyOf<T> =
  T extends Primitive ? never :
  T extends { set(key: any, value: any): any, get(key: infer K): any } ? K :
  T extends { add(value: any): any, [Symbol.iterator]: Function } ? number :
  T extends readonly any[] ? number :
  T extends OpaqueObject ? never :
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
  T extends readonly any[] ? Key extends number ? T[Key] : undefined :
  T extends OpaqueObject ? undefined :
  Key extends keyof T ? T[Key] :
  undefined

/**
 * Replaces `any` with `unknown`.
 */
export type PreferUnknown<T> = 0 extends 1 & T ? unknown : T;

/**
 * Replaces `unknown` with `any`.
 */
export type PreferAny<T> = unknown extends T ? any : T;

/**
 * Poor Man's NoInfer polyfill.
 */
// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html#type-inference-in-conditional-types
// https://devblogs.microsoft.com/typescript/announcing-typescript-5-4-beta/#the-noinfer-utility-type
export type NoInfer<T> = [T][T extends any ? 0 : never];
