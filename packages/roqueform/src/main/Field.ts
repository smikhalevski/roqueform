import { createElement, Fragment, ReactElement, ReactNode, SetStateAction, useEffect, useReducer, useRef } from 'react';
import { callOrGet, isEqual } from './utils';

type Keyof<T> = keyof NonNullable<T>;

type ValueAt<T, K extends Keyof<T>> = T extends null | undefined ? NonNullable<T>[K] | undefined : NonNullable<T>[K];

/**
 * The callback that modifies the given field enhancing it with the additional functionality.
 *
 * If plugin returns void, then it's implied that the passed field object was extended.
 *
 * @template T The value held by the enhanced field.
 * @template P The enhancement added by the plugin.
 */
export type Plugin<T, P> = (field: Field<T>, accessor: Accessor) => (Field<T, P> & P) | void;

/**
 * The abstraction used by the {@link Field} to read and write values in controlled value.
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
 * @template T The value held by the field.
 * @template P The enhancement added by the plugin.
 */
export interface Field<T = any, P = {}> {
  /**
   * The parent field from which this one was derived.
   */
  readonly parent: (Field<any, P> & P) | null;

  /**
   * The key in the parent value that corresponds to the value controlled by the field, or `null` if there's no parent.
   */
  readonly key: any;

  /**
   * Returns the current value of the field.
   */
  getValue(): T;

  /**
   * Returns `true` if the value was last updated using {@link setValue}.
   */
  isTransient(): boolean;

  /**
   * Updates the value of the field and notifies both ancestors and derived fields. If field withholds a transient value
   * then it becomes non-transient.
   *
   * @param value The value to set or a callback that receives a previous value and returns a new one.
   */
  dispatchValue(value: SetStateAction<T>): void;

  /**
   * Updates the value of the field and notifies only derived fields and marks value as transient.
   *
   * @param value The value to set or a callback that receives a previous value and returns a new one.
   */
  setValue(value: SetStateAction<T>): void;

  /**
   * If the current value is transient then notifies parent about this value and marks value as non-transient.
   */
  dispatch(): void;

  /**
   * Derives a new field that controls value that is stored under a key in the value of this field.
   *
   * @param key The key the derived field would control.
   * @returns The derived `Field` instance.
   *
   * @template K The key in the field value.
   */
  at<K extends Keyof<T>>(key: K): Field<ValueAt<T, K>, P> & P;

  /**
   * Subscribes the listener to the field updates.
   *
   * @param listener The listener that would be triggered.
   * @returns The callback to unsubscribe the listener.
   */
  subscribe(
    /**
     * @param targetField The field that was the origin of the update, or where {@link Field.notify} was called.
     * @param currentField The field to which the listener is subscribed.
     */
    listener: (targetField: Field<any, P> & P, currentField: Field<T, P> & P) => void
  ): () => void;

  /**
   * Triggers listeners of the field.
   */
  notify(): void;
}

/**
 * Properties of the {@link Field} component.
 *
 * @template F The field.
 */
export interface FieldProps<F extends Field> {
  /**
   * The field to subscribe to.
   */
  field: F;

  /**
   * The render function that receive a field as an argument or a node to render.
   */
  children: ((field: F) => ReactNode) | ReactNode;

  /**
   * If set to `true` then `Field` is re-rendered whenever the {@link field} is notified, so updates from ancestors and
   * derived fields would trigger re-render, as well as {@link Field.notify} calls on any of those. Otherwise,
   * re-rendered only if field is notified explicitly, so the `targetField` is set to this field.
   *
   * @default false
   */
  eagerlyUpdated?: boolean;

  /**
   * Triggered when the field value received a non-transient update.
   *
   * @param value The new field value.
   */
  onChange?: (value: ReturnType<F['getValue']>) => void;
}

/**
 * The component that subscribes to the given field instance and re-renders its children when the field is updated.
 *
 * @template F The field to subscribe to.
 */
export function Field<F extends Field>(props: FieldProps<F>): ReactElement {
  const { field, eagerlyUpdated } = props;

  const [, rerender] = useReducer(reduceCount, 0);
  const handleChangeRef = useRef<FieldProps<F>['onChange']>();

  handleChangeRef.current = props.onChange;

  useEffect(() => {
    let prevValue: ReturnType<F['getValue']> | undefined;

    return field.subscribe(targetField => {
      const value = field.getValue();

      if (eagerlyUpdated || field === targetField) {
        rerender();
      }
      if (field.isTransient() || isEqual(value, prevValue)) {
        return;
      }

      prevValue = value;

      const handleChange = handleChangeRef.current;
      if (typeof handleChange === 'function') {
        handleChange(value);
      }
    });
  }, [field, eagerlyUpdated]);

  return createElement(Fragment, null, callOrGet(props.children, field));
}

function reduceCount(count: number): number {
  return count + 1;
}
