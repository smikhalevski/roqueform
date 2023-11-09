/**
 * The field that doesn't constrain its children and ancestors. Use this in plugins to streamline typing.
 *
 * @template Plugin The plugin injected into the field.
 */
export type AnyField<Plugin = unknown> = FieldController<any> & Plugin;

/**
 * The field that manages a value and related data. Fields can be {@link PluginInjector enhanced by plugins} that
 * provide integration with rendering frameworks, validation libraries, and other tools.
 *
 * @template Plugin The plugin injected into the field.
 * @template Value The field value.
 */
export type Field<Plugin = unknown, Value = any> = FieldController<Plugin, Value> & Plugin;

/**
 * The event dispatched to subscribers of {@link Field a field}.
 *
 * @template Target The field where the event is dispatched.
 * @template Data The additional data related to the event.
 */
export interface Event<Target = AnyField, Data = any> {
  /**
   * The type of the event.
   */
  type: string;

  /**
   * The field that has changed.
   */
  target: Target;

  /**
   * The original field that caused the event to be dispatched. This can be ancestor, descendant, or the{@link target}
   * itself.
   */
  origin: Field<PluginOf<Target>>;

  /**
   * The additional data related to the event, depends on the {@link type event type}.
   */
  data: Data;
}

/**
 * The callback that receives events dispatched by {@link Field a field}.
 *
 * @param event The dispatched event.
 * @template Target The field where the event is dispatched.
 * @template Data The additional data related to the event.
 */
export type Subscriber<Target = AnyField, Data = any> = (event: Event<Target, Data>) => void;

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
export type PluginOf<T> = T['__plugin__' & keyof T];

/**
 * Infers the value of the field.
 *
 * Use `ValueOf<this>` in plugin interfaces to infer the value of the current field.
 *
 * @template T The field to infer value of.
 */
export type ValueOf<T> = T['value' & keyof T];

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
   * @internal
   */
  readonly ['__plugin__']: Plugin;

  /**
   * The key in the {@link parent parent value} that corresponds to the value of this field, or `null` if there's no
   * parent.
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
   *
   * @protected
   */
  ['root']: Field<Plugin>;

  /**
   * The parent field, or `null` if this is the root field.
   *
   * @protected
   */
  ['parent']: Field<Plugin> | null;

  /**
   * The array of immediate child fields that were {@link at previously accessed}, or `null` if there are no children.
   *
   * This array is populated during {@link FieldController.at} call.
   *
   * @see {@link childrenMap}
   * @protected
   */
  ['children']: Field<Plugin>[] | null;

  /**
   * Mapping from a key to a corresponding child field, or `null` if there are no children.
   *
   * This map is populated during {@link FieldController.at} call.
   *
   * @see {@link children}
   * @protected
   */
  ['childrenMap']: Map<unknown, Field<Plugin>> | null;

  /**
   * The map from an event type to an array of associated subscribers, or `null` if no subscribers were added.
   *
   * @see {@link on}
   * @protected
   */
  ['subscribers']: Record<string, Subscriber<this>[] | undefined> | null;

  /**
   * The accessor that reads the field value from the value of the parent fields, and updates parent value.
   *
   * @see [Accessors](https://github.com/smikhalevski/roqueform#accessors)
   * @protected
   */
  ['valueAccessor']: ValueAccessor;

  /**
   * The plugin that is applied to this field and all child fields when they are accessed, or `null` field isn't
   * enhanced by a plugin.
   *
   * @see [Authoring a plugin](https://github.com/smikhalevski/roqueform#authoring-a-plugin)
   * @protected
   */
  ['plugin']: PluginInjector<Plugin, Value> | null;

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
  on(eventType: '*', subscriber: Subscriber<this>): Unsubscribe;

  /**
   * Subscribes to {@link value the field value} changes.
   *
   * @param eventType The type of the event.
   * @param subscriber The subscriber that would be triggered.
   * @returns The callback to unsubscribe the subscriber.
   */
  on(eventType: 'change:value', subscriber: Subscriber<this, ValueOf<this>>): Unsubscribe;
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
   * Returns the value that corresponds to `key` in `obj`.
   *
   * @param obj An arbitrary object from which the value must be read. May be `undefined` or `null`.
   * @param key The key to read.
   * @returns The value in `obj` that corresponds to the `key`.
   */
  get(obj: any, key: any): any;

  /**
   * Returns the object updated where the `key` is associated with `value`.
   *
   * @param obj The object to update. May be `undefined` or `null`.
   * @param key The key to write.
   * @param value The value to associate with the `key`.
   * @returns The updated object.
   */
  set(obj: any, key: any, value: any): any;
}

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
