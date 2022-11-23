import { SetStateAction } from 'react';

/**
 * The callback that modifies the given field enhancing it with the additional functionality.
 *
 * If plugin returns `undefined`, then it's implied that the passed field object was extended.
 *
 * @param field The field that must be enhanced.
 * @param accessor The accessor that reads and writes object properties.
 * @template T The value controlled by the enhanced field.
 * @template P The enhancement added by the plugin.
 */
export type Plugin<T, P> = (field: Field<T>, accessor: Accessor) => (Field<T, P> & P) | undefined | void;

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
 * @template T The value controlled by the field.
 * @template P The enhancement added by the plugin.
 */
export interface Field<T = any, P = unknown> {
  /**
   * The parent field from which this one was derived, or `null` if there's no parent.
   */
  readonly parent: (Field<any, P> & P) | null;

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
  setValue(value: SetStateAction<T>): void;

  /**
   * Updates the value of the field and notifies only derived fields and marks value as {@linkcode transient}.
   *
   * @param value The value to set or a callback that receives a previous value and returns a new one.
   */
  setTransientValue(value: SetStateAction<T>): void;

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
  at<K extends keyof NonNullable<T>>(
    key: K
  ): Field<T extends null | undefined ? NonNullable<T>[K] | undefined : NonNullable<T>[K], P> & P;

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
     * @param targetField The field that was the origin of the update, or where {@linkcode Field.notify} was called.
     * @param currentField The field to which the listener is subscribed.
     */
    listener: (targetField: Field<any, P> & P, currentField: Field<T, P> & P) => void
  ): () => void;

  /**
   * Triggers listeners of the field.
   */
  notify(): void;
}
