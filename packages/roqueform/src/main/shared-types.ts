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
 * Makes all object properties mutable.
 */
type ExtractObjects<T> = T extends object ? (T extends (...args: any[]) => any ? never : T) : never;

type Mutable<T> = { -readonly [P in keyof T]: T[P] };

/**
 * The key in {@link Plugin} that stores the root field value type.
 */
declare const ROOT_VALUE: unique symbol;

/**
 * The callback that enhances the field.
 *
 * The plugin should _mutate_ the passed field instance.
 *
 * @template Mixin The mixin added by the plugin.
 * @template Value The root field value.
 */
export interface Plugin<Mixin = unknown, Value = any> {
  /**
   * @param field The field that must be enhanced.
   * @param accessor The accessor that reads and writes object properties.
   * @param notify Synchronously notifies listeners of the field.
   */
  (field: Mutable<Field & Mixin>, accessor: Accessor, notify: () => void): void;

  /**
   * Prevents root field value type erasure.
   *
   * @internal
   */
  [ROOT_VALUE]?: Value;
}

/**
 * The abstraction used by the {@link Field} to read and write object properties.
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
 * The field that holds a value and provides means to update it. Fields can be enhanced by plugins that provide such
 * things as integration with rendering and validation libraries.
 *
 * @template Value The root field value.
 * @template Mixin The mixin added by the plugin.
 */
export interface Field<Value = any, Mixin = unknown> {
  /**
   * The parent field from which this one was derived, or `null` if there's no parent.
   */
  readonly parent: (Field<any, Mixin> & Mixin) | null;

  /**
   * The key in the parent value that corresponds to the value controlled by the field, or `null` if there's no parent.
   */
  readonly key: any;

  /**
   * The current value of the field.
   */
  readonly value: Value;

  /**
   * `true` if the value was last updated using {@link setTransientValue}, or `false` otherwise.
   */
  readonly isTransient: boolean;

  /**
   * Updates the value of the field and notifies both ancestors and derived fields. If field withholds a
   * {@link isTransient} value then it becomes non-isTransient.
   *
   * @param value The value to set or a callback that receives a previous value and returns a new one.
   */
  setValue(value: Value | ((prevValue: Value) => Value)): void;

  /**
   * Updates the value of the field and notifies only derived fields and marks value as {@link isTransient transient}.
   *
   * @param value The value to set or a callback that receives a previous value and returns a new one.
   */
  setTransientValue(value: Value | ((prevValue: Value) => Value)): void;

  /**
   * If the current value {@link isTransient is transient} then `dispatch` notifies the parent about this value and
   * marks value as non-transient. No-op otherwise.
   */
  dispatch(): void;

  /**
   * Derives a new field that controls value that is stored under a key in the value of this field.
   *
   * @param key The key the derived field would control.
   * @returns The derived {@link Field} instance.
   * @template Key The key of the object value controlled by the field.
   */
  at<K extends keyof ConsolidateUnion<ExtractObjects<T>>>(
    key: K
  ): Field<ConsolidateUnion<ExtractObjects<T>>[K] | (T extends null | undefined ? undefined : never), M> & M;

  /**
   * Subscribes the listener to field updates.
   *
   * @param listener The listener that would be triggered.
   * @returns The callback to unsubscribe the listener.
   */
  subscribe(
    /**
     * @param updatedField The field that was updated. This can be ancestor, descendant, or the `currentField` itself.
     * @param currentField The field to which the listener is subscribed.
     */
    listener: (updatedField: Field<any, Mixin> & Mixin, currentField: Field<Value, Mixin> & Mixin) => void
  ): () => void;
}
