import { Field, Plugin } from 'roqueform';

/**
 * The mixin added to fields by the {@link constraintValidationPlugin}.
 */
export interface ConstraintValidationMixin {
  /**
   * An error associated with the field, or `null` if there's no error.
   */
  readonly error: string | null;

  /**
   * `true` if the field or any of its derived fields have an associated error, or `false` otherwise.
   */
  readonly isInvalid: boolean;

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
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLObjectElement/setCustomValidity setCustomValidity}
   * if the field has an associated element.
   *
   * If a field has an associated element that doesn't satisfy validation constraints this method is no-op.
   *
   * @param error The error to set.
   */
  setError(error: string): void;

  /**
   * Deletes an error associated with this field. Calls
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLObjectElement/setCustomValidity setCustomValidity}
   * if the field has an associated element.
   *
   * If a field has an associated element that doesn't satisfy validation constraints this method is no-op.
   */
  deleteError(): void;

  /**
   * Returns an array of all errors associated with this field and its derived fields.
   *
   * @returns The array of non-empty error messages.
   */
  collectErrors(): string[];

  /**
   * Recursively deletes errors associated with this field and all of its derived fields. Calls
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLObjectElement/setCustomValidity setCustomValidity}
   * if the field has an associated element.
   *
   * If a field has an associated element that doesn't satisfy validation constraints this method is no-op.
   */
  clearErrors(): void;

  /**
   * Shows error message balloon for the first element that is associated with this field or any of its derived fields,
   * that has an associated error via calling
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/reportValidity reportValidity}.
   *
   * @returns `true` if a field doesn't have an error, or `false` otherwise.
   */
  reportValidity(): boolean;
}

/**
 * Enhances fields with Constraint Validation API methods.
 */
export function constraintValidationPlugin(): Plugin<ConstraintValidationMixin> {
  let controllerMap: WeakMap<Field, FieldController>;

  return (field, _accessor, notify) => {
    controllerMap ||= new WeakMap();

    if (controllerMap.has(field)) {
      return;
    }

    const notifyAncestors = () => {
      for (
        let invalid = false, ancestor: FieldController | null = controller;
        ancestor !== null;
        ancestor = ancestor._parent
      ) {
        invalid ||= isInvalid(controller);

        if (ancestor._isInvalid === invalid) {
          break;
        }
        ancestor._isInvalid = invalid;
        ancestor._notify();
      }
    };

    const controller: FieldController = {
      _parent: null,
      _children: null,
      _field: field,
      _element: null,
      _validity: null,
      _isInvalid: false,
      _error: '',
      _notify: notify,
      _notifyAncestors: notifyAncestors,
    };

    controllerMap.set(field, controller);

    if (field.parent !== null) {
      const parent = controllerMap.get(field.parent)!;

      controller._parent = parent;

      (parent._children ||= []).push(controller);
    }

    const { refCallback } = field;

    const listener = (event: Event): void => {
      if (controller._element !== null && controller._element === event.target) {
        notifyAncestors();
      }
    };

    Object.defineProperties(field, {
      error: { enumerable: true, get: () => getError(controller) },
      isInvalid: { enumerable: true, get: () => isInvalid(controller) },
      validity: { enumerable: true, get: () => controller._validity },
    });

    field.refCallback = element => {
      const { _element } = controller;

      if (_element === element) {
        refCallback?.(element);
        return;
      }

      if (_element !== null) {
        _element.removeEventListener('input', listener);
        _element.removeEventListener('change', listener);
        _element.removeEventListener('invalid', listener);

        controller._element = controller._validity = null;
        controller._error = '';
      }
      if (isValidatable(element)) {
        element.addEventListener('input', listener);
        element.addEventListener('change', listener);
        element.addEventListener('invalid', listener);

        controller._element = element;
        controller._validity = element.validity;
      }

      refCallback?.(element);
      notifyAncestors();
    };

    field.setError = error => {
      setError(controller, error);
    };

    field.deleteError = () => {
      setError(controller, '');
    };

    field.collectErrors = () => collectErrors(controller, []);

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
  _parent: FieldController | null;
  _children: FieldController[] | null;
  _field: Field;
  _element: ValidatableElement | null;
  _validity: ValidityState | null;

  /**
   * The invalid status for which the field was notified the last time.
   */
  _isInvalid: boolean;

  /**
   * An error that is used if the field doesn't have an associated element.
   */
  _error: string;

  /**
   * Synchronously notifies listeners of the field.
   */
  _notify: () => void;

  /**
   * Notifies the field and its ancestors about changes.
   */
  _notifyAncestors: () => void;
}

/**
 * Sets a validation error to the field and notifies it.
 */
function setError(controller: FieldController, error: string): void {
  const { _element } = controller;

  if (_element !== null) {
    if (_element.validationMessage !== error) {
      _element.setCustomValidity(error);
      controller._notifyAncestors();
    }
    return;
  }

  if (controller._error !== error) {
    controller._error = error;
    controller._notifyAncestors();
  }
}

function getError(controller: FieldController): string | null {
  return (controller._element !== null ? controller._element.validationMessage : controller._error) || null;
}

function collectErrors(controller: FieldController, errors: string[]): any[] {
  const error = getError(controller);

  if (error !== null) {
    errors.push(error);
  }
  if (controller._children !== null) {
    for (const child of controller._children) {
      collectErrors(child, errors);
    }
  }
  return errors;
}

function clearErrors(controller: FieldController): void {
  setError(controller, '');

  if (controller._children !== null) {
    for (const child of controller._children) {
      clearErrors(child);
    }
  }
}

function isInvalid(controller: FieldController): boolean {
  if (controller._children !== null) {
    for (const child of controller._children) {
      if (isInvalid(child)) {
        return true;
      }
    }
  }
  return getError(controller) !== null;
}

function reportValidity(controller: FieldController): boolean {
  if (controller._children !== null) {
    for (const child of controller._children) {
      if (!reportValidity(child)) {
        return false;
      }
    }
  }
  return controller._element !== null ? controller._element.reportValidity() : getError(controller) === null;
}

function isValidatable(element: Element | null): element is ValidatableElement {
  return element instanceof Element && 'validity' in element && element.validity instanceof ValidityState;
}
