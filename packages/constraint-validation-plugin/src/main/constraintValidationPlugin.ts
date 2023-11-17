import { dispatchEvents, Event, Field, PluginInjector, PluginOf, Subscriber, Unsubscribe } from 'roqueform';

const EVENT_CHANGE_ERRORS = 'change:errors';
const ERROR_CODE_CUSTOM = 'custom';
const ERROR_CODE_CONSTRAINT = 'constraint';

export interface ConstraintError {
  code?: string;
  message?: any;
  meta?: any;
}

/**
 * The plugin added to fields by the {@link constraintValidationPlugin}.
 */
export interface ConstraintValidationPlugin {
  /**
   * The array of errors associated with this field.
   */
  errors: ConstraintError[];

  /**
   * The DOM element associated with the field, or `null` if there's no associated element.
   */
  element: Element | null;

  /**
   * `true` if the field or any of its child fields have {@link errors an associated error}, or `false` otherwise.
   */
  readonly isInvalid: boolean;

  /**
   * The [validity state](https://developer.mozilla.org/en-US/docs/Web/API/ValidityState), or `null` if there's no
   * associated element, or it doesn't support Constraint Validation API.
   */
  validity: ValidityState | null;

  /**
   * Associates the field with the {@link element DOM element}.
   */
  ref(element: Element | null): void;

  /**
   * Associates an error with the field.
   *
   * @param error The error to add.
   */
  addError(error: ConstraintError | string): void;

  /**
   * Deletes an error associated with this field.
   *
   * @param error The error to delete.
   */
  deleteError(error: ConstraintError): void;

  /**
   * Deletes all errors associated with this field.
   */
  clearErrors(): void;

  /**
   * Recursively deletes errors associated with this field and all of its child fields.
   *
   * @param predicate The callback that returns truthy value if an error must be deleted. If omitted then all errors are
   * deleted.
   */
  clearAllErrors(predicate?: (error: ConstraintError, field: Field<PluginOf<this>>) => boolean): void;

  /**
   * Returns all fields that have associated errors.
   */
  getInvalidFields(): Field<PluginOf<this>>[];

  /**
   * Shows error message balloon for the first element that is associated with this field or any of its child fields,
   * that has an associated error via calling
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/reportValidity reportValidity}.
   *
   * @returns `true` if a field doesn't have an error, or `false` otherwise.
   */
  reportValidity(): boolean;

  /**
   * Subscribes to {@link errors an associated error} changes of this field or any of its descendants.
   *
   * @param eventType The type of the event.
   * @param subscriber The subscriber that would be triggered.
   * @returns The callback to unsubscribe the subscriber.
   * @see {@link error}
   * @see {@link isInvalid}
   */
  on(eventType: 'change:errors', subscriber: Subscriber<PluginOf<this>, ConstraintError[]>): Unsubscribe;
}

/**
 * Enhances fields with Constraint Validation API methods.
 */
export function constraintValidationPlugin(): PluginInjector<ConstraintValidationPlugin> {
  return field => {
    field.errors = [];
    field.element = null;
    field.validity = null;

    Object.defineProperties(field, {
      isInvalid: { configurable: true, get: () => isInvalid(field) },
    });

    const changeListener = () => {
      if (isValidatable(field.element)) {
        dispatchEvents(addOrDeleteConstraintError(field, field.element.validationMessage, []));
      }
    };

    field.on('change:value', changeListener);

    const { ref } = field;

    field.ref = nextElement => {
      const prevElement = field.element;

      ref?.(nextElement);

      if (prevElement === nextElement) {
        return;
      }

      field.element = nextElement = nextElement instanceof Element ? nextElement : null;

      if (prevElement !== null) {
        prevElement.removeEventListener('input', changeListener);
        prevElement.removeEventListener('change', changeListener);
        prevElement.removeEventListener('invalid', changeListener);
      }

      const events: Event[] = [];

      if (isValidatable(nextElement)) {
        nextElement.addEventListener('input', changeListener);
        nextElement.addEventListener('change', changeListener);
        nextElement.addEventListener('invalid', changeListener);

        field.validity = nextElement.validity;
        addOrDeleteConstraintError(field, nextElement.validationMessage, events);
      } else {
        field.validity = null;
        addOrDeleteConstraintError(field, '', events);
      }

      // Subscribers added in React.useLayoutEffect must receive these events
      const task = () => {
        dispatchEvents(events);
      };
      if (typeof queueMicrotask !== 'undefined') {
        queueMicrotask(task);
      } else {
        setTimeout(task, 0);
      }
    };

    field.addError = error => {
      const prevErrors = field.errors;
      const nextErrors = concatErrors(
        prevErrors,
        typeof error === 'string' ? { code: ERROR_CODE_CUSTOM, message: error } : error
      );

      if (prevErrors !== nextErrors) {
        field.errors = nextErrors;

        dispatchEvents([{ type: EVENT_CHANGE_ERRORS, targetField: field, originField: field, data: prevErrors }]);
      }
    };

    field.deleteError = error => {
      const prevErrors = field.errors;
      const errorIndex = prevErrors.indexOf(error);

      if (errorIndex !== -1) {
        const nextErrors = prevErrors.slice(0);
        nextErrors.splice(errorIndex, 1);
        field.errors = nextErrors;

        dispatchEvents([{ type: EVENT_CHANGE_ERRORS, targetField: field, originField: field, data: prevErrors }]);
      }
    };

    field.clearErrors = () => {
      const prevErrors = field.errors;

      if (prevErrors.length !== 0) {
        field.errors = [];
        dispatchEvents([{ type: EVENT_CHANGE_ERRORS, targetField: field, originField: field, data: prevErrors }]);
      }
    };

    field.clearAllErrors = predicate => {
      dispatchEvents(clearAllErrors(field, predicate, []));
    };

    field.getInvalidFields = () => getInvalidFields(field, []);

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

function concatErrors(errors: ConstraintError[], error: ConstraintError): ConstraintError[] {
  for (const otherError of errors) {
    if (otherError.code === error.code) {
      return errors;
    }
  }
  return errors.concat(error);
}

function addOrDeleteConstraintError(
  field: Field<ConstraintValidationPlugin>,
  message: string,
  events: Event[]
): Event[] {
  const prevErrors = field.errors;

  let nextErrors;
  let errorIndex = -1;

  for (let i = 0; i < prevErrors.length; ++i) {
    if (prevErrors[i].code === ERROR_CODE_CONSTRAINT) {
      errorIndex = i;
      break;
    }
  }

  if (errorIndex !== -1) {
    if (message.length !== 0 && prevErrors[errorIndex].message === message) {
      // Message didn't change
      return events;
    }
    nextErrors = prevErrors.slice(0);
    nextErrors.splice(errorIndex, 1);
    field.errors = nextErrors;
  }

  if (message.length !== 0) {
    field.errors = nextErrors ||= [];
    nextErrors.push({ code: ERROR_CODE_CONSTRAINT, message, meta: undefined });
  }

  if (nextErrors !== undefined) {
    events.push({ type: EVENT_CHANGE_ERRORS, targetField: field, originField: field, data: prevErrors });
  }

  return events;
}

function clearAllErrors(
  field: Field<ConstraintValidationPlugin>,
  predicate: ((error: any, field: Field<ConstraintValidationPlugin>) => any) | undefined,
  events: Event[]
): Event[] {
  const prevErrors = field.errors;

  let nextErrors: ConstraintError[] | undefined;

  if (prevErrors.length !== 0) {
    if (predicate !== undefined) {
      for (const error of prevErrors) {
        if (!predicate(error, field)) {
          (nextErrors ||= []).push(error);
        }
      }
    } else {
      nextErrors = [];
    }
  }

  if (nextErrors !== undefined) {
    field.errors = nextErrors;
    events.push({ type: EVENT_CHANGE_ERRORS, targetField: field, originField: field, data: prevErrors });
  }

  if (field.children !== null) {
    for (const child of field.children) {
      clearAllErrors(child, predicate, events);
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
  return isValidatable(field.element) ? field.element.reportValidity() : field.errors.length === 0;
}

function isInvalid(field: Field<ConstraintValidationPlugin>): boolean {
  if (field.errors.length !== 0) {
    return true;
  }
  if (field.children !== null) {
    for (const child of field.children) {
      if (isInvalid(child)) {
        return true;
      }
    }
  }
  return false;
}

function getInvalidFields(
  field: Field<ConstraintValidationPlugin>,
  batch: Field<ConstraintValidationPlugin>[]
): Field<ConstraintValidationPlugin>[] {
  if (field.errors.length !== 0) {
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
