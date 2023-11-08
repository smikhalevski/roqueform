import { createElement, Fragment, ReactElement, ReactNode, useEffect, useReducer, useRef } from 'react';
import { callOrGet, Field } from 'roqueform';

/**
 * Properties of the {@link FieldRenderer} component.
 *
 * @template RenderedField The rendered field.
 */
export interface FieldRendererProps<RenderedField extends Field> {
  /**
   * The field to subscribe to.
   */
  field: RenderedField;

  /**
   * The render function that receive a field as an argument.
   */
  children: (field: RenderedField) => ReactNode;

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
  onChange?: (value: RenderedField['value']) => void;
}

/**
 * The component that subscribes to the {@link Field} instance and re-renders its children when the field is notified.
 *
 * @template RenderedField The rendered field.
 */
export function FieldRenderer<RenderedField extends Field>(props: FieldRendererProps<RenderedField>): ReactElement {
  const { field, eagerlyUpdated } = props;

  const [, rerender] = useReducer(reduceCount, 0);
  const handleChangeRef = useRef<FieldRendererProps<RenderedField>['onChange']>();

  handleChangeRef.current = props.onChange;

  useEffect(() => {
    return field.on('*', event => {
      if (eagerlyUpdated || event.target === field) {
        rerender();
      }
      if (field.isTransient || event.type !== 'valueChange') {
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
