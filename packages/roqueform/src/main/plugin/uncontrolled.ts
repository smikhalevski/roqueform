/**
 * Updates Roqueform fields by listening to change events of associated DOM elements.
 *
 * ```ts
 * import uncontrolledPlugin from 'roqueform/plugin/uncontrolled';
 * ```
 *
 * @module plugin/uncontrolled
 */

import { createElementsValueAccessor } from '../createElementsValueAccessor.js';
import { Field, FieldPlugin } from '../FieldImpl.js';

export {
  createElementsValueAccessor,
  type ElementsValueAccessor,
  type ElementsValueAccessorOptions,
} from '../createElementsValueAccessor.js';

/**
 * The default value accessor.
 */
const defaultElementsValueAccessor = createElementsValueAccessor();

/**
 * The mixin added to fields by the {@link uncontrolledPlugin}.
 */
export interface UncontrolledMixin {
  /**
   * Associates the field with the DOM element.
   */
  ref: (element: Element | null) => void;
}

/**
 * Updates field value when the DOM element value is changed and vice versa.
 */
export default function uncontrolledPlugin(
  accessor = defaultElementsValueAccessor
): FieldPlugin<any, UncontrolledMixin> {
  return (field: Field<unknown, UncontrolledMixin>) => {
    const { ref } = field;

    const elements = new Set<Element>();

    field.ref = nextElement => {
      if (nextElement !== null && nextElement !== undefined) {
        // Connected

        nextElement.addEventListener('input', handleChange);
        elements.add(nextElement);
      } else {
        // Disconnected

        for (const element of elements) {
          if (!element.isConnected) {
            element.removeEventListener('input', handleChange);
            elements.delete(element);
          }
        }
      }

      if (elements.size !== 0) {
        accessor.set(Array.from(elements), field.value);
      }

      ref?.(nextElement);
    };

    let prevValue = field.value;

    const handleChange: EventListener = event => {
      if (!elements.has(event.currentTarget as Element)) {
        return;
      }

      prevValue = accessor.get(Array.from(elements));
      field.setValue(prevValue);
    };

    field.subscribe(event => {
      if (event.type !== 'valueChanged' || event.target !== field || field.value === prevValue) {
        return;
      }

      if (elements.size !== 0) {
        accessor.set(Array.from(elements), field.value);
      }
    });
  };
}
