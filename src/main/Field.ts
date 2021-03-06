import { createElement, Fragment, ReactElement, ReactNode, SetStateAction, useEffect, useReducer, useRef } from 'react';
import { callOrGet } from './utils';

/**
 * The callback that modifies the given field enhancing it with the additional functionality.
 *
 * @template M The type of mixin added by the enhancer.
 */
export type Enhancer<M> = (field: Field) => Field & M;

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
 * @template T The type of the value held by the field.
 * @template M The type of mixin added by the enhancer.
 */
export interface Field<T = any, M = {}> {
  /**
   * The parent field from which this one was derived.
   */
  parent: (Field<any, M> & M) | null;

  /**
   * The key in the parent value that corresponds to the value controlled by the field, or `null` if there's no parent.
   */
  key: any;

  /**
   * The current value of the field.
   */
  value: T;

  /**
   * `true` if the value was last updated using {@link setValue}.
   */
  transient: boolean;

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
   * @template K The type of the key.
   */
  at<K extends keyof T>(key: K): Field<T[K], M> & M;

  /**
   * Subscribes the listener to the field updates.
   *
   * @param listener The listener that would be triggered.
   * @returns The callback to unsubscribe the listener.
   */
  subscribe(listener: (targetField: Field<any, M> & M) => void): () => void;

  /**
   * Triggers listeners of the field.
   */
  notify(): void;
}

/**
 * Properties of the {@link Field} component.
 *
 * @template F The type of the field.
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
  onChange?: (value: F['value']) => void;
}

/**
 * The component that subscribes to the given field instance and re-renders its children when the field is updated.
 *
 * @template F The type of the field.
 */
export function Field<F extends Field>(props: FieldProps<F>): ReactElement {
  const { field, eagerlyUpdated } = props;

  const [, rerender] = useReducer(reduceCount, 0);
  const handleChangeRef = useRef<FieldProps<F>['onChange']>();

  handleChangeRef.current = props.onChange;

  useEffect(() => {
    let prevValue: F['value'] | undefined;

    return field.subscribe(targetField => {
      const { value } = field;

      if (eagerlyUpdated || field === targetField) {
        rerender();
      }
      if (field.transient || Object.is(value, prevValue)) {
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
