import { Plugin } from 'roqueform';
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
  /**
   * The callback that associates the field with the DOM element.
   */
  refCallback(element: Element | null): void;

  /**
   * Overrides the element value accessor for the field.
   *
   * @param accessor The accessor to use for this filed.
   */
  setAccessor(accessor: Partial<ElementValueAccessor>): this;
}

/**
 * Updates field value when the DOM element value is changed and vice versa.
 *
 * @param accessor The accessor that reads and writes value to and from the DOM elements managed by the filed.
 */
export function uncontrolledPlugin(accessor = elementValueAccessor): Plugin<UncontrolledPlugin> {
  return field => {
    const { refCallback } = field;

    let elements: Element[] = [];
    let targetElement: Element | null = null;

    let getElementValue = accessor.get;
    let setElementValue = accessor.set;

    const mutationObserver = new MutationObserver((mutations: MutationRecord[]) => {
      for (const mutation of mutations) {
        for (let i = 0; i < mutation.removedNodes.length; ++i) {
          const j = elements.indexOf(mutation.removedNodes.item(i) as Element);
          if (j === -1) {
            continue;
          }

          elements[j].removeEventListener('input', changeListener);
          elements[j].removeEventListener('change', changeListener);

          elements.splice(j, 1);
        }
      }

      if (elements.length === 0) {
        mutationObserver.disconnect();
        targetElement = null;
        refCallback?.(targetElement);
        return;
      }

      if (targetElement !== elements[0]) {
        targetElement = elements[0];
        refCallback?.(targetElement);
      }
    });

    const changeListener = (event: Event): void => {
      let value;
      if (
        elements.indexOf(event.target as Element) !== -1 &&
        !isDeepEqual((value = getElementValue(elements.slice(0))), field.value)
      ) {
        field.setValue(value);
      }
    };

    field.subscribe(() => {
      if (elements.length !== 0) {
        setElementValue(elements.slice(0), field.value);
      }
    });

    field.refCallback = element => {
      if (
        element === null ||
        !(element instanceof Element) ||
        !element.isConnected ||
        elements.indexOf(element) !== -1
      ) {
        return;
      }

      mutationObserver.observe(element.parentNode!, { childList: true });

      element.addEventListener('input', changeListener);
      element.addEventListener('change', changeListener);

      elements.push(element);

      setElementValue(elements.slice(0), field.value);

      if (elements.length === 1) {
        targetElement = elements[0];
        refCallback?.(targetElement);
      }
    };

    field.setAccessor = accessor => {
      getElementValue = accessor.get || getElementValue;
      setElementValue = accessor.set || setElementValue;
      return field;
    };
  };
}
