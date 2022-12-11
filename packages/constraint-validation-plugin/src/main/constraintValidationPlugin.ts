import { Field, Plugin } from 'roqueform';

/**
 * The enhancement added to fields by the {@linkcode constraintValidationPlugin}.
 */
export interface ConstraintValidationPlugin {
  /**
   * The object that holds the reference to the current DOM element.
   */
  readonly ref: { current: Element | null };

  /**
   * The callback that updates {@linkcode ref}.
   */
  refCallback(element: Element | null): void;

  /**
   * `true` if the field or any of its derived fields have an associated error, or `false` otherwise.
   */
  readonly invalid: boolean;

  /**
   * The [validity state](https://developer.mozilla.org/en-US/docs/Web/API/ValidityState) or `null` if ref isn't set or
   * an element doesn't support Constraint Validation API.
   */
  readonly validity: ValidityState | null;

  /**
   * An error associated with the field, or `null` if there's no error.
   */
  readonly error: string | null;

  /**
   * Associates an error with the field, calls
   * {@linkcode https://developer.mozilla.org/en-US/docs/Web/API/HTMLObjectElement/setCustomValidity setCustomValidity}.
   *
   * If an underlying field doesn't satisfy validation constraints this method is no-op.
   *
   * @param error The error to set.
   */
  setError(error: string): void;

  /**
   * Deletes an error associated with this field, calls
   * {@linkcode https://developer.mozilla.org/en-US/docs/Web/API/HTMLObjectElement/setCustomValidity setCustomValidity}.
   *
   * If an underlying field doesn't satisfy validation constraints this method is no-op.
   */
  deleteError(): void;

  /**
   * Recursively deletes errors associated with this field and all of its derived fields, calls
   * {@linkcode https://developer.mozilla.org/en-US/docs/Web/API/HTMLObjectElement/setCustomValidity setCustomValidity}.
   */
  clearErrors(): void;

  /**
   * Shows error message balloon for the first element that is referenced by this field or any of its derived fields,
   * that has an associated error, calls
   * {@linkcode https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/reportValidity reportValidity}.
   *
   * @returns `true` if the element's child controls satisfy their validation constraints, or `false` otherwise.
   */
  reportValidity(): boolean;
}

/**
 * Enhances fields with Constraint Validation API methods.
 */
export function constraintValidationPlugin<T>(): Plugin<T, ConstraintValidationPlugin> {
  let controllerMap: WeakMap<Field, FieldController> | undefined;

  return field => {
    controllerMap ||= new WeakMap();

    if (!controllerMap.has(field)) {
      enhanceField(field, controllerMap);
    }
  };
}

type ValidatableElement =
  | HTMLButtonElement
  | HTMLFieldSetElement
  | HTMLFormElement
  | HTMLInputElement
  | HTMLObjectElement
  | HTMLOutputElement
  | HTMLSelectElement
  | HTMLTextAreaElement;

interface EnhancedField extends Field {
  ref?: { current: Element | null };

  refCallback?(element: Element | null): void;
}

interface FieldController {
  __parent: FieldController | null;
  __children: FieldController[] | null;
  __field: EnhancedField;
  __ref: { current: Element | null };

  /**
   * The invalid status for which the field was notified the last time.
   */
  __invalid: boolean;
}

function enhanceField(field: EnhancedField, controllerMap: WeakMap<Field, FieldController>): void {
  const ref = field.ref || { current: null };
  const refCallback = field.refCallback;

  const controller: FieldController = {
    __parent: null,
    __children: null,
    __field: field,
    __ref: ref,
    __invalid: false,
  };

  controllerMap.set(field, controller);

  if (field.parent !== null) {
    const parent = controllerMap.get(field.parent)!;

    controller.__parent = parent;

    (parent.__children ||= []).push(controller);
  }

  const listener = (event: Event): void => {
    if (ref.current == null || event.target != ref.current) {
      return;
    }

    for (
      let invalid = false, targetController = controller;
      targetController.__parent !== null;
      targetController = targetController.__parent
    ) {
      invalid ||= isInvalid(controller);

      if (targetController.__invalid === invalid) {
        break;
      }
      targetController.__invalid = invalid;
      targetController.__field.notify();
    }
  };

  Object.assign<Field, Omit<ConstraintValidationPlugin, 'invalid' | 'validity' | 'error'>>(field, {
    ref,

    refCallback(element) {
      refCallback?.(element);

      const prevElement = ref.current;

      if (prevElement != element && prevElement != null) {
        prevElement.removeEventListener('input', listener);
        prevElement.removeEventListener('change', listener);
        prevElement.removeEventListener('invalid', listener);
      }
      if (prevElement != element && isValidatableElement(element)) {
        element.addEventListener('input', listener);
        element.addEventListener('change', listener);
        element.addEventListener('invalid', listener);
      }

      ref.current = element;
    },
    setError(error) {
      setError(controller, error);
    },
    deleteError() {
      setError(controller, '');
    },
    clearErrors() {
      clearErrors(controller);
    },
    reportValidity() {
      return reportValidity(controller);
    },
  });

  Object.defineProperties(field, {
    invalid: {
      get() {
        return isInvalid(controller);
      },
      enumerable: true,
      configurable: true,
    },
    validity: {
      get() {
        return isValidatableElement(ref.current) ? ref.current.validity : null;
      },
      enumerable: true,
      configurable: true,
    },
    error: {
      get() {
        return isValidatableElement(ref.current) ? ref.current.validationMessage : null;
      },
      enumerable: true,
      configurable: true,
    },
  });
}

/**
 * Sets a validation error to the field and notifies it.
 */
function setError(controller: FieldController, error: string): void {
  const element = controller.__ref.current;

  if (isValidatableElement(element) && element.validationMessage !== error) {
    element.setCustomValidity(error);
    element.checkValidity();
  }
}

function clearErrors(controller: FieldController): void {
  setError(controller, '');

  if (controller.__children !== null) {
    for (const child of controller.__children) {
      clearErrors(child);
    }
  }
}

function isInvalid(controller: FieldController): boolean {
  if (controller.__children !== null) {
    for (const child of controller.__children) {
      if (isInvalid(child)) {
        return true;
      }
    }
  }
  const element = controller.__ref.current;
  return isValidatableElement(element) && element.validationMessage !== '';
}

function reportValidity(controller: FieldController): boolean {
  if (controller.__children !== null) {
    for (const child of controller.__children) {
      if (!reportValidity(child)) {
        return false;
      }
    }
  }
  const element = controller.__ref.current;
  return isValidatableElement(element) && element.reportValidity();
}

/**
 * Returns `true` if an element supports Constraint Validation API, or `false` otherwise.
 */
function isValidatableElement(element: Element | null): element is ValidatableElement {
  return element != null && 'validity' in element && element.validity instanceof ValidityState;
}
