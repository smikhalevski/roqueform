import { createElement, Fragment, ReactElement, ReactNode, useEffect, useReducer, useRef } from 'react';
import { callOrGet, Field, isEqual } from 'roqueform';

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
   * If set to `true` then {@linkcode FieldRenderer} is re-rendered whenever the {@linkcode field} itself, its parent
   * fields or descendant fields are updated. If set to `false` then {@linkcode FieldRenderer} re-rendered only if the
   * field was directly changed (updates from parent and descendants are ignored, even if they affect the value of the
   * field).
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
