/**
 * Consolidates properties of all objects in union into a single object.
 *
 * ```
 * ConsolidateUnion<{ a: X, b: B } | { a: Y, b: B, c: C }> → { a: X | Y, b: B, c: C | undefined }
 * ```
 */
type ConsolidateUnion<T> = {
  [K in T extends infer P ? keyof P : never]: T extends infer P ? (K extends keyof P ? P[K] : undefined) : never;
};

/**
 * Extracts objects and excludes functions.
 */
type ExtractObjects<T> = T extends object ? (T extends (...args: any[]) => any ? never : T) : never;

type Mutable<T> = { -readonly [P in keyof T]: T[P] };

/**
 * The key in {@linkcode Plugin} that stores the root field value type.
 */
declare const ROOT_VALUE: unique symbol;

/**
 * The callback that enhances the field.
 *
 * The plugin should _mutate_ the passed field instance.
 *
 * @param field The field that must be enhanced.
 * @param accessor The accessor that reads and writes object properties.
 * @param notify Synchronously notifies listeners of the field.
 * @template M The mixin added by the plugin.
 * @template T The root field value.
 */
export interface Plugin<M = unknown, T = any> {
  (field: Field & Mutable<M>, accessor: Accessor, notify: () => void): void;

  /**
   * Prevents root value type erasure.
   * @internal
   */
  [ROOT_VALUE]?: T;
}

/**
 * The abstraction used by the {@linkcode Field} to read and write object properties.
 */
export interface Accessor {
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

/**
 * @template T The root field value.
 * @template M The mixin added by the plugin.
 */
export interface Field<T = any, M = unknown> {
  /**
   * The parent field from which this one was derived, or `null` if there's no parent.
   */
  readonly parent: (Field<any, M> & M) | null;

  /**
   * The key in the parent value that corresponds to the value controlled by the field, or `null` if there's no parent.
   */
  readonly key: any;

  /**
   * The current value of the field.
   */
  readonly value: T;

  /**
   * `true` if the value was last updated using {@linkcode setTransientValue}, or `false` otherwise.
   */
  readonly transient: boolean;

  /**
   * Updates the value of the field and notifies both ancestors and derived fields. If field withholds a
   * {@linkcode transient} value then it becomes non-transient.
   *
   * @param value The value to set or a callback that receives a previous value and returns a new one.
   */
  setValue(value: T | ((prevValue: T) => T)): void;

  /**
   * Updates the value of the field and notifies only derived fields and marks value as {@linkcode transient}.
   *
   * @param value The value to set or a callback that receives a previous value and returns a new one.
   */
  setTransientValue(value: T | ((prevValue: T) => T)): void;

  /**
   * If the current value is {@linkcode transient} then notifies parent about this value and marks value as
   * non-transient.
   */
  dispatch(): void;

  /**
   * Derives a new field that controls value that is stored under a key in the value of this field.
   *
   * @param key The key the derived field would control.
   * @returns The derived `Field` instance.
   * @template K The key of the object value controlled by the field.
   */
  at<K extends keyof ConsolidateUnion<ExtractObjects<T>>>(
    key: K
  ): Field<ConsolidateUnion<ExtractObjects<T>>[K] | (T extends null | undefined ? undefined : never), M> & M;

  /**
   * Subscribes the listener to the field updates.
   *
   * Listeners are guaranteed to be called once when {@linkcode notify} is called.
   *
   * @param listener The listener that would be triggered.
   * @returns The callback to unsubscribe the listener.
   */
  subscribe(
    /**
     * @param targetField The field that triggered the update. This can be ancestor ot descendant field.
     * @param field The field to which this listener is subscribed.
     */
    listener: (targetField: Field<any, M> & M, field: Field<T, M> & M) => void
  ): () => void;
}
