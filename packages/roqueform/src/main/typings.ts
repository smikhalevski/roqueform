/**
 * The field describes field that holds a value and provides means to update it. Fields can be enhanced by plugins that
 * provide such things as integration with rendering and validation libraries.
 *
 * @template Value The field value.
 * @template Plugin The plugin added to the field.
 */
export type Field<Value = any, Plugin = unknown> = FieldController<Value, Plugin> & Plugin;

/**
 * The baseline of a field.
 *
 * @template Value The field value.
 * @template Plugin The plugin added to the field.
 */
interface FieldController<Value = any, Plugin = unknown> {
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
   */
  isTransient: boolean;

  /**
   * The root field.
   */
  ['root']: Field<any, Plugin>;

  /**
   * The parent field, or `null` if this is the root field.
   */
  ['parent']: Field<any, Plugin> | null;

  /**
   * The array of immediate child fields that were {@link at previously accessed}, or `null` if there's no children.
   *
   * @see {@link childrenMap}
   */
  ['children']: Field<any, Plugin>[];

  /**
   * Mapping from a key to a child field.
   *
   * @see {@link children}
   */
  ['childrenMap']: Map<unknown, Field<any, Plugin>>;

  /**
   * The map from an event type to an array of associated listeners, or `null` if no listeners were added.
   */
  ['eventListeners']: { [eventType: string]: Array<(event: Event<Value, Plugin>) => void> };

  /**
   * The accessor that reads the field value from the value of the parent fields, and updates parent value.
   */
  ['valueAccessor']: ValueAccessor;

  /**
   * The plugin that is applied to this field and all child field when they are accessed.
   */
  ['plugin']: PluginCallback<Plugin, Value> | null;

  /**
   * Updates the field value and notifies both ancestor and child fields about the change. If the field withholds
   * {@link isTransient a transient value} then it becomes non-transient.
   *
   * @param value The value to set, or a callback that receives a previous value and returns a new one.
   */
  setValue(value: Value | ((prevValue: Value) => Value)): void;

  /**
   * Updates the value of the field, notifies child fields about the change, and marks value as
   * {@link isTransient transient}.
   *
   * @param value The value to set, or a callback that receives a previous value and returns a new one.
   */
  setTransientValue(value: Value | ((prevValue: Value) => Value)): void;

  /**
   * If {@link value the current value} {@link isTransient is transient} then the value of the parent field is notified
   * about the change and this field is marked as non-transient.
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
  at<Key extends KeyOf<Value>>(key: Key): Field<ValueAt<Value, Key>, Plugin>;

  /**
   * Subscribes the listener to all events.
   *
   * @param eventType The type of the event.
   * @param listener The listener that would be triggered.
   * @returns The callback to unsubscribe the listener.
   */
  on(eventType: '*', listener: (event: Event<Value, Plugin>) => void): () => void;

  /**
   * Subscribes the listener to field value changes.
   *
   * @param eventType The type of the event.
   * @param listener The listener that would be triggered.
   * @returns The callback to unsubscribe the listener.
   */
  on(eventType: 'valueChanged', listener: (event: ValueChangeEvent<Value, Plugin>) => void): () => void;
}

/**
 * The event dispatched to subscribers of {@link Field a field}.
 *
 * @template Value The field value.
 * @template Plugin The plugin added to the field.
 */
export interface Event<Value = any, Plugin = unknown> {
  /**
   * The type of the event.
   */
  type: string;

  /**
   * The field that caused the event to be dispatched. This can be ancestor, descendant, or the {@link currentTarget}.
   */
  target: Field<any, Plugin>;

  /**
   * The field to which the event listener is subscribed.
   */
  currentTarget: Field<Value, Plugin>;
}

/**
 * The event dispatched when the field value has changed.
 *
 * @template Value The field value.
 * @template Plugin The plugin added to the field.
 */
export interface ValueChangeEvent<Value = any, Plugin = unknown> extends Event<Value, Plugin> {
  type: 'change';

  /**
   * The previous value that was replaced by {@link Field.value the current field value}.
   */
  previousValue: Value;
}

/**
 * The callback that enhances the field.
 *
 * The plugin should _mutate_ the passed field instance.
 *
 * @template Plugin The plugin added to the field.
 * @template Value The root field value.
 */
export type PluginCallback<Plugin = unknown, Value = any> = (field: Field<Value, Plugin>) => void;

/**
 * Infers plugin from a field.
 */
export type InferPlugin<Field> = Field extends FieldController<any, infer Plugin> ? Plugin : unknown;

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
  T extends { set(key: any, value: any): any, get(key: infer K): infer V } ? Key extends K ? V : never :
  T extends { add(value: infer V): any, [Symbol.iterator]: Function } ? Key extends number ? V | undefined : never :
  T extends readonly any[] ? Key extends number ? T[Key] : never :
  Key extends keyof T ? T[Key] :
  never
