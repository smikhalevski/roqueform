import { createElement, Fragment, ReactElement, ReactNode, useEffect, useReducer, useRef } from 'react';
import { callOrGet, isEqual } from './public-utils';
import { Field } from './public-types';

/**
 * Properties of the {@linkcode FieldRenderer} component.
 *
 * @template F The field.
 */
export interface FieldRendererProps<F extends Field> {
  /**
   * The field to subscribe to.
   */
  field: F;

  /**
   * The render function that receive a field as an argument or a node to render.
   */
  children: ((field: F) => ReactNode) | ReactNode;

  /**
   * If set to `true` then `Field` is re-rendered whenever the {@linkcode field} is notified, so updates from ancestors
   * and derived fields would trigger re-render, as well as {@linkcode Field.notify} calls on any of those. Otherwise,
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
 * The component that subscribes to the {@linkcode Field} instance and re-renders its children when the field is
 * notified.
 *
 * @template F The field.
 */
export function FieldRenderer<F extends Field>(props: FieldRendererProps<F>): ReactElement {
  const { field, eagerlyUpdated } = props;

  const [, rerender] = useReducer(reduceCount, 0);
  const handleChangeRef = useRef<FieldRendererProps<F>['onChange']>();

  handleChangeRef.current = props.onChange;

  useEffect(() => {
    let prevValue: F['value'] | undefined;

    return field.subscribe(targetField => {
      const { value } = field;

      if (eagerlyUpdated || field === targetField) {
        rerender();
      }
      if (field.transient || isEqual(value, prevValue)) {
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
