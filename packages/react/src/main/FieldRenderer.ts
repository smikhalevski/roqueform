import {
  createElement,
  Fragment,
  isValidElement,
  ReactElement,
  ReactNode,
  useLayoutEffect,
  useReducer,
  useRef,
} from 'react';
import { callOrGet, Field, ValueOf } from 'roqueform';

/**
 * Properties of the {@link FieldRenderer} component.
 *
 * @template Field The rendered field.
 */
export interface FieldRendererProps<F extends Field> {
  /**
   * The field that triggers re-renders.
   */
  field: F;

  /**
   * The render function that receive a rendered field as an argument.
   */
  children: (field: F) => ReactNode;

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
  onChange?: (value: ValueOf<F>) => void;
}

/**
 * The component that subscribes to the field instance and re-renders its children when an event is dispatched onto the
 * field.
 *
 * @template Field The rendered field.
 */
export function FieldRenderer<F extends Field>(props: FieldRendererProps<F>): ReactElement {
  const { field, eagerlyUpdated } = props;

  const [, rerender] = useReducer(reduceCount, 0);
  const handleChangeRef = useRef<FieldRendererProps<F>['onChange']>();

  handleChangeRef.current = props.onChange;

  if (typeof window !== 'undefined') {
    useLayoutEffect(
      () =>
        field.on('*', event => {
          if (eagerlyUpdated || event.originField === field) {
            rerender();
          }
          if (field.isTransient || event.type !== 'change:value' || event.targetField !== field) {
            // The non-transient value of this field didn't change
            return;
          }

          const handleChange = handleChangeRef.current;
          if (typeof handleChange === 'function') {
            handleChange(field.value);
          }
        }),
      [field, eagerlyUpdated]
    );
  }

  const children = callOrGet(props.children, field);

  return isValidElement(children) ? children : createElement(Fragment, null, children);
}

function reduceCount(count: number): number {
  return count + 1;
}
