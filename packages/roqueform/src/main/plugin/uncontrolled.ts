/**
 * Updates Roqueform fields by listening to change events of associated DOM elements.
 *
 * ```ts
 * import { createField } from 'roqueform';
 * import uncontrolledPlugin from 'roqueform/plugin/uncontrolled';
 *
 * const field = createField({ hello: 'world' }, [uncontrolledPlugin()]);
 *
 * field.at('hello').ref(document.querySelector('input'));
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

const elementsValueAccessor = createElementsValueAccessor();

/**
 * The mixin added to fields by the {@link uncontrolledPlugin}.
 */
export interface UncontrolledMixin {
  /**
   * Associates the field with DOM elements.
   */
  ref(element: Element | null): void;
}

/**
 * Updates field value when the DOM element value is changed and vice versa.
 */
export default function uncontrolledPlugin(accessor = elementsValueAccessor): FieldPlugin<any, UncontrolledMixin> {
  return (field: Field<unknown, UncontrolledMixin>) => {
    const { ref } = field;

    const elements: Element[] = [];

    const handleChange: EventListener = event => {
      if (elements.includes(event.currentTarget as Element)) {
        // Value have changed
        field.setValue(accessor.get(elements));
      }
    };

    field.ref = element => {
      if (element !== null && element !== undefined) {
        // Connected

        if (elements.includes(element)) {
          return;
        }
        element.addEventListener('input', handleChange);
        elements.push(element);
      } else {
        // Disconnected

        for (let i = 0; i < elements.length; ++i) {
          if (!elements[i].isConnected) {
            elements[i].removeEventListener('input', handleChange);
            elements.splice(i--, 1);
          }
        }
      }

      if (elements.length === 0) {
        // The default element was disconnected
        ref?.(null);
        return;
      }

      accessor.set(elements, field.value);

      if (element !== null && elements.indexOf(element) === 0) {
        // The default element has changed
        ref?.(element);
      }
    };

    field.subscribe(event => {
      if (event.type !== 'valueChanged' || event.target !== field) {
        return;
      }

      if (elements.length !== 0) {
        accessor.set(elements, field.value);
      }
    });
  };
}
