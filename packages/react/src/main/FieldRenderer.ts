import { ReactNode } from 'react';
import { Field } from 'roqueform';
import { FieldSubscriptionOptions, useFieldSubscription } from './useFieldSubscription.js';

/**
 * Properties of the {@link FieldRenderer} component.
 *
 * @template F The rendered field.
 */
export interface FieldRendererProps<F extends Field> extends FieldSubscriptionOptions<F> {
  /**
   * The field that triggers re-renders.
   */
  field: F;

  /**
   * The render function that receive a rendered field as an argument.
   */
  children: (field: F) => ReactNode;
}

/**
 * The component that subscribes to the field instance and re-renders its children when an event is dispatched onto the
 * field.
 *
 * @template F The rendered field.
 */
export function FieldRenderer<F extends Field>(props: FieldRendererProps<F>): ReactNode {
  return props.children(useFieldSubscription(props.field, props));
}
