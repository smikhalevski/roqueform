import { Field, PluginInjector } from 'roqueform';
import { createElementsValueAccessor, ElementsValueAccessor } from './createElementsValueAccessor';

/**
 * The default value accessor.
 */
const elementsValueAccessor = createElementsValueAccessor();

/**
 * The plugin added to fields by the {@link uncontrolledPlugin}.
 */
export interface UncontrolledPlugin {
  /**
   * The DOM element associated with the field, or `null` if there's no associated element.
   */
  element: Element | null;

  /**
   * The array of elements controlled by this field, includes {@link element}.
   *
   * @protected
   */
  ['elements']: readonly Element[];

  /**
   * The map from a key passed to {@link refFor} to a corresponding element. If {@link refFor} was called with `null`
   * then a key is deleted from this map.
   *
   * @protected
   */
  ['elementsMap']: ReadonlyMap<unknown, Element>;

  /**
   * The accessor that reads and writes the field value from and to {@link elements}.
   *
   * @protected
   */
  ['elementsValueAccessor']: ElementsValueAccessor;

  /**
   * Associates the field with the DOM element.
   */
  ref(element: Element | null): void;

  /**
   * Returns a callback that associates the field with the DOM element under the given key in {@link elementsMap}.
   */
  refFor(key: unknown): (element: Element | null) => void;
}

/**
 * Updates field value when the DOM element value is changed and vice versa.
 */
export function uncontrolledPlugin(accessor = elementsValueAccessor): PluginInjector<UncontrolledPlugin> {
  return field => {
    field.element = null;
    field.elements = [];
    field.elementsMap = new Map();
    field.elementsValueAccessor = accessor;

    const refsMap = new Map<unknown, (element: Element | null) => void>();

    let prevValue = field.value;

    const changeListener: EventListener = event => {
      if (field.elements.includes(event.target as Element)) {
        field.setValue((prevValue = field.elementsValueAccessor.get(field.elements)));
      }
    };

    field.on('change:value', event => {
      if (field.value !== prevValue && event.target === field && field.elements.length !== 0) {
        field.elementsValueAccessor.set(field.elements, field.value);
      }
    });

    const { ref } = field;

    field.ref = nextElement => {
      const prevElement = field.element;

      ref?.(nextElement);

      field.element = swapElements(field, changeListener, prevElement, nextElement);
    };

    field.refFor = key => {
      let ref = refsMap.get(key);

      if (ref === undefined) {
        ref = nextElement => {
          const elementsMap = field.elementsMap as Map<unknown, Element>;
          const prevElement = elementsMap.get(key) || null;

          nextElement = swapElements(field, changeListener, prevElement, nextElement);

          if (prevElement === nextElement) {
            return;
          }
          if (nextElement === null) {
            elementsMap.delete(key);
          } else {
            elementsMap.set(key, nextElement);
          }
        };
        refsMap.set(key, ref);
      }

      return ref;
    };
  };
}

function swapElements(
  field: Field<UncontrolledPlugin>,
  changeListener: EventListener,
  prevElement: Element | null,
  nextElement: Element | null
): Element | null {
  const elements = field.elements as Element[];

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

  if (nextElement !== null && elements.indexOf(nextElement) === -1) {
    nextElement.addEventListener(
      nextElement.tagName === 'INPUT' || nextElement.tagName === 'TEXTAREA' ? 'input' : 'change',
      changeListener
    );

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
  if (elements.length !== 0) {
    field.elementsValueAccessor.set(elements, field.value);
  }
  return nextElement;
}
