import { createElementsValueAccessor } from '../createElementsValueAccessor.js';
import { Field, FieldPlugin } from '../__FieldImpl.js';
import { createObservableRefArray, ObservableRefArray, RefArray } from '../utils.js';

export {
  createElementsValueAccessor,
  type ElementsValueAccessor,
  type ElementsValueAccessorOptions,
} from '../createElementsValueAccessor.js';

/**
 * The default value accessor.
 */
const elementsValueAccessor = createElementsValueAccessor();

/**
 * The mixin added to fields by the {@link uncontrolledPlugin}.
 */
export interface UncontrolledMixin {
  /**
   * Associates the field with the DOM element.
   */
  ref: RefArray<Element | null>;
}

/**
 * Updates field value when the DOM element value is changed and vice versa.
 */
export default function uncontrolledPlugin(accessor = elementsValueAccessor): FieldPlugin<any, UncontrolledMixin> {
  return (field: Field<unknown, UncontrolledMixin>) => {
    const ref = createObservableRefArray<Element | null>(null);

    field.ref = ref;

    let prevValue = field.value;

    const handleChange: EventListener = event => {
      const elements = getElements(ref);

      if (!elements.includes(event.target as Element)) {
        return;
      }

      prevValue = accessor.get(elements);
      field.setValue(prevValue);
    };

    field.subscribe(event => {
      if (event.type !== 'valueChanged' || event.target !== field || field.value === prevValue) {
        return;
      }

      const elements = getElements(ref);

      if (elements.length !== 0) {
        accessor.set(elements, field.value);
      }
    });

    ref.subscribe(event => {
      const { prevValue, nextValue } = event;

      if (prevValue !== null) {
        prevValue.removeEventListener('input', handleChange);
      }
      if (nextValue !== null) {
        nextValue.addEventListener('input', handleChange);
      }

      const elements = getElements(ref);

      if (elements.length !== 0) {
        accessor.set(elements, field.value);
      }
    });
  };
}

function getElements(refArray: ObservableRefArray<Element | null>): Element[] {
  const elements = [];

  for (const ref of refArray._refs) {
    if (ref.current instanceof Element) {
      elements.push(ref.current);
    }
  }

  return elements;
}
