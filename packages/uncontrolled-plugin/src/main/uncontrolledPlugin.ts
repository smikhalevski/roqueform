import { Field, PluginInjector } from 'roqueform';
import isDeepEqual from 'fast-deep-equal';
import { createElementValueAccessor, ElementValueAccessor } from './createElementValueAccessor';

/**
 * The default value accessor.
 */
const elementValueAccessor = createElementValueAccessor();

/**
 * The plugin added to fields by the {@link uncontrolledPlugin}.
 */
export interface UncontrolledPlugin {
  element: Element | null;

  /**
   * The accessor that reads and writes the field value from and to {@link elements}.
   *
   * @protected
   */
  ['elementValueAccessor']: ElementValueAccessor;

  /**
   * Associates the field with the DOM element.
   */
  ref(element: Element | null): void;

  /**
   * Returns a callback that associates the field with the DOM element under the given key.
   */
  refFor(key: unknown): (element: Element | null) => void;
}

/**
 * Updates field value when the DOM element value is changed and vice versa.
 */
export function uncontrolledPlugin(accessor = elementValueAccessor): PluginInjector<UncontrolledPlugin> {
  return field => {
    field.elementValueAccessor = accessor;

    const refs = new Map<unknown, (element: Element | null) => void>();
    const elements: Element[] = [];
    const elementMap = new Map<unknown, Element | null>();

    let prevValue = field.value;

    const changeListener: EventListener = event => {
      let value;
      if (
        elements.includes(event.target as Element) &&
        !isDeepEqual((value = field.elementValueAccessor.get(elements)), field.value)
      ) {
        field.setValue((prevValue = value));
      }
    };

    field.on('change:value', event => {
      if (field.value !== prevValue && event.target === field && elements.length !== 0) {
        field.elementValueAccessor.set(elements, field.value);
      }
    });

    const { ref } = field;

    field.ref = nextElement => {
      const prevElement = field.element;

      ref?.(nextElement);

      field.element = swapElements(field, changeListener, elements, prevElement, nextElement);
    };

    field.refFor = key => {
      let ref = refs.get(key);
      if (ref !== undefined) {
        return ref;
      }

      ref = nextElement => {
        const prevElement = elementMap.get(key) || null;

        nextElement = swapElements(field, changeListener, elements, prevElement, nextElement);

        if (prevElement !== nextElement) {
          elementMap.set(key, nextElement);
        }
      };
      refs.set(key, ref);
      return ref;
    };
  };
}

function swapElements(
  field: Field<UncontrolledPlugin>,
  changeListener: EventListener,
  elements: Element[],
  prevElement: Element | null,
  nextElement: Element | null
): Element | null {
  nextElement = nextElement instanceof Element ? nextElement : null;

  if (prevElement === nextElement) {
    return nextElement;
  }

  let prevIndex = -1;

  if (prevElement !== null) {
    prevElement.removeEventListener('input', changeListener);
    prevElement.removeEventListener('change', changeListener);
    prevIndex = elements.indexOf(prevElement);
  }

  if (nextElement !== null) {
    nextElement.addEventListener('input', changeListener);
    nextElement.addEventListener('change', changeListener);

    if (prevIndex === -1) {
      elements.push(nextElement);
    } else {
      elements[prevIndex] = nextElement;
      prevIndex = -1;
    }
  }

  if (prevIndex !== -1) {
    elements.splice(prevIndex, 1);
  }

  field.elementValueAccessor.set(elements, field.value);

  return nextElement;
}
