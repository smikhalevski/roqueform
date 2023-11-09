import { createElement, Fragment, ReactElement, ReactNode, useEffect, useReducer, useRef } from 'react';
import { AnyField, callOrGet, ValueOf } from 'roqueform';

/**
 * Properties of the {@link FieldRenderer} component.
 *
 * @template Field The rendered field.
 */
export interface FieldRendererProps<Field extends AnyField> {
  /**
   * The field to subscribe to.
   */
  field: Field;

  /**
   * The render function that receive a field as an argument.
   */
  children: (field: Field) => ReactNode;

  /**
   * If set to `true` then {@link FieldRenderer} is re-rendered whenever the {@link field} itself, its parent fields or
   * descendant fields are updated. If set to `false` then {@link FieldRenderer} re-rendered only if the field was
   * directly changed (updates from parent and descendants are ignored, even if they affect the value of the field).
   *
   * @default false
   */
  eagerlyUpdated?: boolean;

  /**
   * Triggered when the field value received a non-transient update.
   *
   * @param value The new field value.
   */
  onChange?: (value: ValueOf<Field>) => void;
}

/**
 * The component that subscribes to the {@link Field} instance and re-renders its children when the field is notified.
 *
 * @template Field The rendered field.
 */
export function FieldRenderer<Field extends AnyField>(props: FieldRendererProps<Field>): ReactElement {
  const { field, eagerlyUpdated } = props;

  const [, rerender] = useReducer(reduceCount, 0);
  const handleChangeRef = useRef<FieldRendererProps<Field>['onChange']>();

  handleChangeRef.current = props.onChange;

  useEffect(() => {
    return field.on('*', event => {
      if (eagerlyUpdated || event.origin === field) {
        rerender();
      }
      if (field.isTransient || event.type !== 'change:value') {
        return;
      }

      const handleChange = handleChangeRef.current;
      if (typeof handleChange === 'function') {
        handleChange(field.value);
      }
    });
  }, [field, eagerlyUpdated]);

  return createElement(Fragment, null, callOrGet(props.children, field));
}

function reduceCount(count: number): number {
  return count + 1;
}
