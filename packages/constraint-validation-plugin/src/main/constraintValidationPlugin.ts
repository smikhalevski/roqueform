import { dispatchEvents, Event, Field, PluginInjector, PluginOf, Subscriber, Unsubscribe } from 'roqueform';

const EVENT_CHANGE_ERROR = 'change:error';

/**
 * The plugin added to fields by the {@link constraintValidationPlugin}.
 */
export interface ConstraintValidationPlugin {
  /**
   * A non-empty error message associated with the field, or `null` if there's no error.
   */
  error: string | null;

  /**
   * The DOM element associated with the field, or `null` if there's no associated element.
   */
  element: Element | null;

  /**
   * `true` if the field or any of its child fields have {@link error an associated error}, or `false` otherwise.
   */
  readonly isInvalid: boolean;

  /**
   * The [validity state](https://developer.mozilla.org/en-US/docs/Web/API/ValidityState), or `null` if there's no
   * associated element, or it doesn't support Constraint Validation API.
   */
  validity: ValidityState | null;

  /**
   * The total number of errors associated with this field and its child fields.
   *
   * @protected
   */
  ['errorCount']: number;

  /**
   * The origin of the associated error:
   * - 0 if there's no associated error.
   * - 1 if an error was set by Constraint Validation API;
   * - 2 if an error was set using {@link ValidationPlugin.setError};
   *
   * @protected
   */
  ['errorOrigin']: 0 | 1 | 2;

  /**
   * Associates the field with the {@link element DOM element}.
   */
  ref(element: Element | null): void;

  /**
   * Associates an error with the field.
   *
   * @param error The error to set. If `null`, `undefined`, or an empty string then an error is deleted.
   */
  setError(error: string | null | undefined): void;

  /**
   * Deletes an error associated with this field. If this field has {@link element an associated element} that supports
   * [Constraint Validation API](https://developer.mozilla.org/en-US/docs/Web/HTML/Constraint_validation) and the
   * element has a non-empty `validationMessage` then this message would be immediately set as an error for this field.
   */
  deleteError(): void;

  /**
   * Recursively deletes errors associated with this field and all of its child fields.
   */
  clearErrors(): void;

  /**
   * Shows error message balloon for the first element that is associated with this field or any of its child fields,
   * that has an associated error via calling
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/reportValidity reportValidity}.
   *
   * @returns `true` if a field doesn't have an error, or `false` otherwise.
   */
  reportValidity(): boolean;

  /**
   * Returns all errors associated with this field and its child fields.
   */
  getErrors(): string[];

  /**
   * Returns all fields that have an error.
   */
  getInvalidFields(): Field<PluginOf<this>>[];

  /**
   * Subscribes to {@link error an associated error} changes of this field or any of its descendants.
   *
   * @param eventType The type of the event.
   * @param subscriber The subscriber that would be triggered.
   * @returns The callback to unsubscribe the subscriber.
   * @see {@link error}
   * @see {@link isInvalid}
   */
  on(eventType: 'change:error', subscriber: Subscriber<this, string | null>): Unsubscribe;
}

/**
 * Enhances fields with Constraint Validation API methods.
 */
export function constraintValidationPlugin(): PluginInjector<ConstraintValidationPlugin> {
  return field => {
    field.error = null;
    field.element = null;
    field.validity = null;
    field.errorCount = 0;
    field.errorOrigin = 0;

    Object.defineProperties(field, {
      isInvalid: { configurable: true, get: () => field.errorCount !== 0 },
    });

    const changeListener: EventListener = event => {
      if (field.element === event.target && isValidatable(field.element)) {
        dispatchEvents(setError(field, field.element.validationMessage, 1, []));
      }
    };

    const { ref } = field;

    field.ref = element => {
      if (field.element === element) {
        // Same element
        ref?.(element);
        return;
      }

      if (field.element !== null) {
        // Disconnect current element
        field.element.removeEventListener('input', changeListener);
        field.element.removeEventListener('change', changeListener);
        field.element.removeEventListener('invalid', changeListener);

        field.element = null;
      }

      field.element = element;
      field.validity = null;

      const events: Event[] = [];

      if (isValidatable(element)) {
        // Connect new element
        element.addEventListener('input', changeListener);
        element.addEventListener('change', changeListener);
        element.addEventListener('invalid', changeListener);

        field.validity = element.validity;
        setError(field, element.validationMessage, 1, events);
      } else {
        // Delete the associated constraint error
        deleteError(field, 1, events);
      }

      dispatchEvents(events);

      ref?.(element);
    };

    field.setError = error => {
      dispatchEvents(setError(field, error, 2, []));
    };

    field.deleteError = () => {
      dispatchEvents(deleteError(field, 2, []));
    };

    field.clearErrors = () => {
      dispatchEvents(clearErrors(field, []));
    };

    field.reportValidity = () => reportValidity(field);

    field.getErrors = () => getInvalidFields(field, []).map(field => field.error!);

    field.getInvalidFields = () => getInvalidFields(field, []);
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

function setError(
  field: Field<ConstraintValidationPlugin>,
  error: string | null | undefined,
  errorOrigin: 1 | 2,
  events: Event[]
): Event[] {
  if (error === null || error === undefined || error.length === 0) {
    return deleteError(field, errorOrigin, events);
  }

  const originalError = field.error;

  if (field.errorOrigin > errorOrigin || (originalError === error && field.errorOrigin === errorOrigin)) {
    return events;
  }

  if (errorOrigin === 2 && isValidatable(field.element)) {
    // Custom validation error
    field.element.setCustomValidity(error);
  }

  field.error = error;
  field.errorOrigin = errorOrigin;

  events.push({ type: EVENT_CHANGE_ERROR, origin: field, target: field, data: originalError });

  if (originalError !== null) {
    return events;
  }

  field.errorCount++;

  for (let ancestor = field.parent; ancestor !== null; ancestor = ancestor.parent) {
    if (ancestor.errorCount++ === 0) {
      events.push({ type: EVENT_CHANGE_ERROR, origin: field, target: ancestor, data: originalError });
    }
  }

  return events;
}

function deleteError(field: Field<ConstraintValidationPlugin>, errorOrigin: 1 | 2, events: Event[]): Event[] {
  const { error: originalError, element } = field;

  if (field.errorOrigin > errorOrigin || originalError === null) {
    return events;
  }

  if (isValidatable(element)) {
    element.setCustomValidity('');

    if (!element.validity.valid) {
      field.errorOrigin = 1;

      if (originalError !== (field.error = element.validationMessage)) {
        events.push({ type: EVENT_CHANGE_ERROR, origin: field, target: field, data: originalError });
      }
      return events;
    }
  }

  field.error = null;
  field.errorOrigin = 0;
  field.errorCount--;

  events.push({ type: EVENT_CHANGE_ERROR, origin: field, target: field, data: originalError });

  for (let ancestor = field.parent; ancestor !== null; ancestor = ancestor.parent) {
    if (--ancestor.errorCount === 0) {
      events.push({ type: EVENT_CHANGE_ERROR, origin: field, target: ancestor, data: originalError });
    }
  }

  return events;
}

function clearErrors(field: Field<ConstraintValidationPlugin>, events: Event[]): Event[] {
  deleteError(field, 2, events);

  if (field.children !== null) {
    for (const child of field.children) {
      clearErrors(child, events);
    }
  }
  return events;
}

function reportValidity(field: Field<ConstraintValidationPlugin>): boolean {
  if (field.children !== null) {
    for (const child of field.children) {
      if (!reportValidity(child)) {
        return false;
      }
    }
  }
  return isValidatable(field.element) ? field.element.reportValidity() : field.error === null;
}

function getInvalidFields(
  field: Field<ConstraintValidationPlugin>,
  batch: Field<ConstraintValidationPlugin>[]
): Field<ConstraintValidationPlugin>[] {
  if (field.error !== null) {
    batch.push(field);
  }
  if (field.children !== null) {
    for (const child of field.children) {
      getInvalidFields(child, batch);
    }
  }
  return batch;
}

function isValidatable(element: Element | null): element is ValidatableElement {
  return element instanceof Element && 'validity' in element && element.validity instanceof ValidityState;
}
