import { Plugin } from 'roqueform';
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
 * @param accessor The accessor that reads and writes value to and from the DOM element.
 */
export function uncontrolledPlugin(accessor = elementValueAccessor): Plugin<UncontrolledMixin> {
  return field => {
    const { setValue, setTransientValue, refCallback } = field;

    let targetElement: Element | null = null;

    const listener = (event: Event): void => {
      if (targetElement !== null && event.target === targetElement) {
        setValue(accessor.get(targetElement));
      }
    };

    field.setValue = value => {
      if (targetElement !== null) {
        accessor.set(targetElement, value);
      }
      setValue(value);
    };

    field.setTransientValue = value => {
      if (targetElement !== null) {
        accessor.set(targetElement, value);
      }
      setTransientValue(value);
    };

    field.refCallback = element => {
      if (targetElement === element) {
        refCallback?.(targetElement);
        return;
      }

      if (targetElement !== null) {
        targetElement.removeEventListener('input', listener);
        targetElement.removeEventListener('change', listener);

        targetElement = null;
      }
      if (element instanceof Element) {
        element.addEventListener('input', listener);
        element.addEventListener('change', listener);

        targetElement = element;
        accessor.set(targetElement, field.value);
      }

      refCallback?.(targetElement);
    };
  };
}
