import { Plugin } from 'roqueform';
import isDeepEqual from 'fast-deep-equal';
import { elementValueAccessor } from './elementValueAccessor';

/**
 * The mixin added to fields by the {@linkcode uncontrolledPlugin}.
 */
export interface UncontrolledMixin {
  /**
   * The callback that associates the field with the DOM element.
   */
  refCallback(element: Element | null): void;
}

/**
 * Updates field value when the DOM element value is changed and vice versa.
 *
 * @param accessor The accessor that reads and writes value to and from the DOM elements managed by the filed.
 */
export function uncontrolledPlugin(accessor = elementValueAccessor): Plugin<UncontrolledMixin> {
  return field => {
    const { setValue, setTransientValue, refCallback } = field;

    const elements: Element[] = [];

    let targetElement: Element | null = null;

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
        !isDeepEqual((value = accessor.get(elements)), field.value)
      ) {
        setValue(value);
      }
    };

    field.refCallback = element => {
      if (element === null || elements.indexOf(element) !== -1) {
        return;
      }

      element.addEventListener('input', changeListener);
      element.addEventListener('change', changeListener);

      elements.push(element);

      accessor.set(elements, field.value);

      if (element.parentNode) {
        mutationObserver.observe(element.parentNode, { childList: true });
      }

      if (elements.length === 0) {
        targetElement = elements[0];
        refCallback?.(targetElement);
      }
    };

    field.setValue = value => {
      if (elements.length !== 0) {
        accessor.set(elements, value);
      }
      setValue(value);
    };

    field.setTransientValue = value => {
      if (elements.length !== 0) {
        accessor.set(elements, value);
      }
      setTransientValue(value);
    };
  };
}
