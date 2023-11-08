import { dispatchEvents, Field, FieldEvent, PluginCallback } from 'roqueform';

/**
 * The plugin added to fields by the {@link constraintValidationPlugin}.
 */
export interface ConstraintValidationPlugin {
  /**
   * @internal
   */
  ['__plugin']: unknown;

  /**
   * @internal
   */
  value: unknown;

  /**
   * An error associated with the field, or `null` if there's no error.
   */
  error: string | null;

  /**
   * The element which provides the validity status.
   */
  element: Element | null;

  /**
   * `true` if the field or any of its derived fields have an associated error, or `false` otherwise.
   */
  isInvalid: boolean;

  /**
   * The [validity state](https://developer.mozilla.org/en-US/docs/Web/API/ValidityState), or `null` if there's no
   * associated element, or it doesn't support Constraint Validation API.
   */
  readonly validity: ValidityState | null;

  /**
   * Associates the field with the DOM element.
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

  /**
   * Subscribes the listener field validity change events. An {@link error} would contain the associated error.
   *
   * @param eventType The type of the event.
   * @param listener The listener that would be triggered.
   * @returns The callback to unsubscribe the listener.
   */
  on(eventType: 'validityChange', listener: (event: FieldEvent<this['value'], this['__plugin']>) => void): () => void;
}

/**
 * Enhances fields with Constraint Validation API methods.
 */
export function constraintValidationPlugin(): PluginCallback<ConstraintValidationPlugin> {
  return field => {
    const { refCallback } = field;

    const changeListener = (event: Event): void => {
      if (field.element === event.target && isValidatable(event.target as Element)) {
        dispatchEvents(setInvalid(field, []));
      }
    };

    Object.defineProperties(field, {
      validity: { enumerable: true, get: () => (isValidatable(field.element) ? field.element.validity : null) },
    });

    field.refCallback = element => {
      if (field.element === element) {
        refCallback?.(element);
        return;
      }

      if (field.element !== null) {
        field.element.removeEventListener('input', changeListener);
        field.element.removeEventListener('change', changeListener);
        field.element.removeEventListener('invalid', changeListener);

        field.element = field.error = null;
      }
      if (isValidatable(element)) {
        element.addEventListener('input', changeListener);
        element.addEventListener('change', changeListener);
        element.addEventListener('invalid', changeListener);
      }
      field.element = element;

      refCallback?.(element);
      dispatchEvents(setInvalid(field, []));
    };

    field.setError = error => {
      setError(field, error);
    };

    field.deleteError = () => {
      setError(field, null);
    };

    field.clearErrors = () => {
      clearErrors(field);
    };

    field.reportValidity = () => reportValidity(field);
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

function setInvalid(
  field: Field<ConstraintValidationPlugin>,
  events: FieldEvent<ConstraintValidationPlugin>[]
): FieldEvent<ConstraintValidationPlugin>[] {
  for (
    let invalid = false, ancestor: Field<ConstraintValidationPlugin> | null = field;
    ancestor !== null;
    ancestor = ancestor.parent
  ) {
    invalid ||= isInvalid(field);

    if (ancestor.isInvalid === invalid) {
      break;
    }
    ancestor.isInvalid = invalid;
    events.push({ type: 'validityChange', target: field, currentTarget: ancestor });
  }
  return events;
}

function setError(field: Field<ConstraintValidationPlugin>, error: string | null | undefined): void {
  if (isValidatable(field.element)) {
    error ||= '';

    if (field.element.validationMessage !== error) {
      field.element.setCustomValidity(error);
      dispatchEvents(setInvalid(field, []));
    }
    return;
  }

  error ||= null;

  if (field.error !== error) {
    field.error = error;
    dispatchEvents(setInvalid(field, []));
  }
}

function getError(field: Field<ConstraintValidationPlugin>): string | null {
  return isValidatable(field.element) ? field.element.validationMessage || null : field.error;
}

function clearErrors(field: Field<ConstraintValidationPlugin>): void {
  setError(field, null);

  if (field.children !== null) {
    for (const child of field.children) {
      clearErrors(child);
    }
  }
}

function isInvalid(field: Field<ConstraintValidationPlugin>): boolean {
  if (field.children !== null) {
    for (const child of field.children) {
      if (isInvalid(child)) {
        return true;
      }
    }
  }
  return getError(field) !== null;
}

function reportValidity(field: Field<ConstraintValidationPlugin>): boolean {
  if (field.children !== null) {
    for (const child of field.children) {
      if (!reportValidity(child)) {
        return false;
      }
    }
  }
  return isValidatable(field.element) ? field.element.reportValidity() : getError(field) === null;
}

function isValidatable(element: Element | null): element is ValidatableElement {
  return element instanceof Element && 'validity' in element && element.validity instanceof ValidityState;
}
