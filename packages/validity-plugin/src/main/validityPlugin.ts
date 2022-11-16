import { Field, Plugin } from 'roqueform';
import { MutableRefObject, RefCallback, RefObject } from 'react';

export type ValidityElement =
  | HTMLButtonElement
  | HTMLFieldSetElement
  | HTMLFormElement
  | HTMLInputElement
  | HTMLObjectElement
  | HTMLOutputElement
  | HTMLSelectElement
  | HTMLTextAreaElement;

/**
 * The enhancement added to fields by the {@linkcode validityPlugin}.
 */
export interface ValidityPlugin {
  ref: RefObject<ValidityElement>;

  refCallback: RefCallback<ValidityElement>;

  isInvalid(): boolean;

  getValidity(): ValidityState | null;

  getError(): string;

  setError(error: string): void;

  validate(): void;
}

/**
 * Adds DOM-related methods to a field.
 */
export function validityPlugin(): Plugin<any, ValidityPlugin> {
  return field => {
    enhanceField(field);
  };
}

/**
 * @internal
 * The property that holds a controller instance.
 *
 * **Note:** Controller isn't intended to be accessed outside the plugin internal functions.
 */
const CONTROLLER_SYMBOL = Symbol('validityPlugin.controller');

/**
 * @internal
 * Retrieves a controller for the field instance.
 */
function getController(field: any): FieldController {
  return field[CONTROLLER_SYMBOL];
}

/**
 * @internal
 * The field controllers organise a tree that parallel to the tree of fields.
 */
interface FieldController {
  __parent: FieldController | null;
  __children: FieldController[] | null;
  __field: Field;
  __issueCount: number;
  __ref: MutableRefObject<ValidityElement | null>;
  __invalid: boolean;
}

/**
 * @internal
 */
function enhanceField(field: Field): void {
  const controller: FieldController = {
    __parent: null,
    __children: null,
    __field: field,
    __issueCount: 0,
    __ref: { current: null },
    __invalid: false,
  };

  if (field.parent !== null) {
    const parent = getController(field.parent);

    controller.__parent = parent;

    (parent.__children ||= []).push(controller);
  }

  const listener = (event: Event): void => {
    if (event.target !== controller.__ref.current) {
      return;
    }
    const invalid = isInvalid(controller);

    if (controller.__invalid === invalid) {
      return;
    }
    controller.__invalid = invalid;
    controller.__field.notify();
  };

  Object.defineProperty(field, CONTROLLER_SYMBOL, { value: controller, enumerable: true });

  Object.assign<Field, ValidityPlugin>(field, {
    ref: controller.__ref,

    refCallback(element) {
      const prevElement = controller.__ref.current;

      if (prevElement === element) {
        return;
      }

      controller.__ref.current = element;

      if (prevElement !== null) {
        prevElement.removeEventListener('input', listener);
        prevElement.removeEventListener('change', listener);
        prevElement.removeEventListener('invalid', listener);
      }
      if (element !== null) {
        element.addEventListener('input', listener);
        element.addEventListener('change', listener);
        element.addEventListener('invalid', listener);
      }
    },
    isInvalid() {
      return controller.__invalid;
    },
    getValidity() {
      return controller.__ref.current?.validity || null;
    },
    getError() {
      return controller.__ref.current?.validationMessage;
    },
    setError(error) {
      controller.__ref.current?.setCustomValidity(error);
    },
    validate() {
      controller.__ref.current?.checkValidity();
    },
  });
}

function isInvalid(controller: FieldController): boolean {
  if (controller.__ref.current !== null && controller.__ref.current.validationMessage !== '') {
    return true;
  }
  if (controller.__children !== null) {
    for (const child of controller.__children) {
      if (isInvalid(child)) {
        return true;
      }
    }
  }
  return false;
}
