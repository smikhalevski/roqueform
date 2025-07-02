import { Field, InferValue } from 'roqueform';
import { useEffect, useReducer, useRef } from 'react';

export interface FieldSubscriptionOptions<F extends Field> {
  /**
   * If set to `true` then the component is re-rendered whenever the field itself, its parent fields or descendant
   * fields are updated. If set to `false` then the component re-rendered only if the field was directly changed
   * (updates from parent and descendants are ignored, even if they affect the value of the field).
   *
   * @default false
   */
  isEagerlyUpdated?: boolean;

  /**
   * Triggered when the field value received a non-transient update.
   *
   * @param value The new field value.
   */
  onChange?: (value: InferValue<F>) => void;
}

/**
 * Re-renders the component if field is changed.
 *
 * @param field The field that triggers re-renders.
 * @param options Subscription options.
 */
export function useFieldSubscription<F extends Field>(field: F, options: FieldSubscriptionOptions<F> = {}): F {
  const [, rerender] = useReducer(reduceCount, 0);
  const optionsRef = useRef(options);

  optionsRef.current = options;

  useEffect(
    () =>
      field.subscribe(event => {
        const { isEagerlyUpdated, onChange } = optionsRef.current;

        if (isEagerlyUpdated || event.target === field) {
          rerender();
        }

        if (onChange !== undefined && event.type === 'valueChanged' && event.target === field && !field.isTransient) {
          onChange(field.value);
        }
      }),
    [field]
  );

  return field;
}

function reduceCount(count: number): number {
  return count + 1;
}
