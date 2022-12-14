import { Field, Plugin } from 'roqueform';

/**
 * The mixin added to fields by the {@linkcode constraintValidationPlugin}.
 */
export interface ConstraintValidationMixin {
  /**
   * An error associated with the field, en empty string if there's no error.
   */
  readonly error: string | null;

  /**
   * `true` if the field or any of its derived fields have an associated error, or `false` otherwise.
   */
  readonly invalid: boolean;

  /**
   * The [validity state](https://developer.mozilla.org/en-US/docs/Web/API/ValidityState), or `null` if there's no
   * associated element, or it doesn't support Constraint Validation API.
   */
  readonly validity: ValidityState | null;

  /**
   * The callback that associates the field with the DOM element.
   */
  refCallback(element: Element | null): void;

  /**
   * Associates an error with the field. Calls
   * {@linkcode https://developer.mozilla.org/en-US/docs/Web/API/HTMLObjectElement/setCustomValidity setCustomValidity}
   * if the field has an associated element.
   *
   * If a field has an associated element that doesn't satisfy validation constraints this method is no-op.
   *
   * @param error The error to set.
   */
  setError(error: string): void;

  /**
   * Deletes an error associated with this field. Calls
   * {@linkcode https://developer.mozilla.org/en-US/docs/Web/API/HTMLObjectElement/setCustomValidity setCustomValidity}
   * if the field has an associated element.
   *
   * If a field has an associated element that doesn't satisfy validation constraints this method is no-op.
   */
  deleteError(): void;

  /**
   * Recursively deletes errors associated with this field and all of its derived fields. Calls
   * {@linkcode https://developer.mozilla.org/en-US/docs/Web/API/HTMLObjectElement/setCustomValidity setCustomValidity}
   * if the field has an associated element.
   *
   * If a field has an associated element that doesn't satisfy validation constraints this method is no-op.
   */
  clearErrors(): void;

  /**
   * Shows error message balloon for the first element that is associated with this field or any of its derived fields,
   * that has an associated error via calling
   * {@linkcode https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/reportValidity reportValidity}.
   *
   * @returns `true` if a field doesn't have an error, or `false` otherwise.
   */
  reportValidity(): boolean;
}

/**
 * Enhances fields with Constraint Validation API methods.
 */
export function constraintValidationPlugin(): Plugin<ConstraintValidationMixin> {
  const controllerMap = new WeakMap<Field, FieldController>();

  return field => {
    if (controllerMap.has(field)) {
      return;
    }

    const notify = () => {
      for (
        let invalid = false, ancestor: FieldController | null = controller;
        ancestor !== null;
        ancestor = ancestor.__parent
      ) {
        invalid ||= isInvalid(controller);

        if (ancestor.__invalid === invalid) {
          break;
        }
        ancestor.__invalid = invalid;
        ancestor.__field.notify();
      }
    };

    const controller: FieldController = {
      __parent: null,
      __children: null,
      __field: field,
      __element: null,
      __validity: null,
      __invalid: false,
      __error: '',
      __notify: notify,
    };

    controllerMap.set(field, controller);

    if (field.parent !== null) {
      const parent = controllerMap.get(field.parent)!;

      controller.__parent = parent;

      (parent.__children ||= []).push(controller);
    }

    const { refCallback } = field;

    const listener = (event: Event): void => {
      if (controller.__element !== null && controller.__element === event.target) {
        notify();
      }
    };

    Object.defineProperties(field, {
      invalid: { enumerable: true, get: () => isInvalid(controller) },
      error: { enumerable: true, get: () => getError(controller) },
      validity: { enumerable: true, get: () => controller.__validity },
    });

    field.refCallback = element => {
      const { __element } = controller;

      if (__element === element) {
        refCallback?.(element);
        return;
      }

      if (__element !== null) {
        __element.removeEventListener('input', listener);
        __element.removeEventListener('change', listener);
        __element.removeEventListener('invalid', listener);

        controller.__element = controller.__validity = null;
        controller.__error = '';
      }
      if (isValidatable(element)) {
        element.addEventListener('input', listener);
        element.addEventListener('change', listener);
        element.addEventListener('invalid', listener);

        controller.__element = element;
        controller.__validity = element.validity;
      }

      refCallback?.(element);
      notify();
    };

    field.setError = error => {
      setError(controller, error);
    };

    field.deleteError = () => {
      setError(controller, '');
    };

    field.clearErrors = () => {
      clearErrors(controller);
    };

    field.reportValidity = () => reportValidity(controller);
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

interface FieldController {
  __parent: FieldController | null;
  __children: FieldController[] | null;
  __field: Field;
  __element: ValidatableElement | null;
  __validity: ValidityState | null;

  /**
   * The invalid status for which the field was notified the last time.
   */
  __invalid: boolean;

  /**
   * An error that is used if the field doesn't have an associated element.
   */
  __error: string;

  /**
   * Notifies the field about changes.
   */
  __notify(): void;
}

/**
 * Sets a validation error to the field and notifies it.
 */
function setError(controller: FieldController, error: string): void {
  const { __element } = controller;

  if (__element !== null) {
    if (__element.validationMessage !== error) {
      __element.setCustomValidity(error);
      controller.__notify();
    }
    return;
  }

  if (controller.__error !== error) {
    controller.__error = error;
    controller.__notify();
  }
}

function getError(controller: FieldController): string {
  return (controller.__element !== null ? controller.__element.validationMessage : controller.__error) || null;
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
  return getError(controller) !== null;
}

function reportValidity(controller: FieldController): boolean {
  if (controller.__children !== null) {
    for (const child of controller.__children) {
      if (!reportValidity(child)) {
        return false;
      }
    }
  }
  return controller.__element !== null ? controller.__element.reportValidity() : getError(controller) === null;
}

function isValidatable(element: Element | null): element is ValidatableElement {
  return element instanceof Element && 'validity' in element && element.validity instanceof ValidityState;
}
