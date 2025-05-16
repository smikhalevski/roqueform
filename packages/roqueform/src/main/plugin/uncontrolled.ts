import { createElementsValueAccessor } from '../createElementsValueAccessor.js';
import { Field, FieldPlugin } from '../Field.js';
import { ObservableRefArray } from '../utils.js';

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
  ref: ObservableRefArray<Element | null>;
}

/**
 * Updates field value when the DOM element value is changed and vice versa.
 */
export default function uncontrolledPlugin(accessor = elementsValueAccessor): FieldPlugin<any, UncontrolledMixin> {
  return (field: Field<unknown, UncontrolledMixin>) => {
    field.ref = new ObservableRefArray(null);

    let prevValue = field.value;

    const handleChange: EventListener = event => {
      const elements = getElements(field.ref);

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

      const elements = getElements(field.ref);

      if (elements.length !== 0) {
        accessor.set(elements, field.value);
      }
    });

    field.ref.subscribe(event => {
      const { prevValue, nextValue } = event;

      if (prevValue !== null) {
        prevValue.removeEventListener('input', handleChange);
      }
      if (nextValue !== null) {
        nextValue.addEventListener('input', handleChange);
      }

      const elements = getElements(field.ref);

      if (elements.length !== 0) {
        accessor.set(elements, field.value);
      }
    });
  };
}

function getElements(refArray: ObservableRefArray<Element | null>): Element[] {
  const elements = [];

  for (const ref of refArray.toArray()) {
    if (ref.current !== null) {
      elements.push(ref.current);
    }
  }
  return elements;
}
