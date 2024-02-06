import { dispatchEvents, Field, PluginInjector, PluginOf, Subscriber, Unsubscribe } from 'roqueform';

/**
 * The plugin added to fields by the {@link constraintValidationPlugin}.
 */
export interface ConstraintValidationPlugin {
  /**
   * The DOM element that supports the Constraint validation API associated with the field, or `null` if there's no
   * such element.
   */
  validatedElement: ValidatableElement | null;

  /**
   * `true` if this field has {@link validity a validity issue}, or `false` otherwise.
   */
  readonly isInvalid: boolean;

  /**
   * The copy of the last reported [validity state](https://developer.mozilla.org/en-US/docs/Web/API/ValidityState)
   * read from the {@link validatedElement}, or `null` if there's no associated validatable element.
   */
  validity: ValidityState | null;

  /**
   * Associates the field with the {@link element DOM element}.
   */
  ref(element: Element | null): void;

  /**
   * Shows error message balloon for the first element that is associated with this field or any of its child fields,
   * that has an associated error via calling
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/reportValidity reportValidity}.
   *
   * @returns `true` if a field doesn't have an error, or `false` otherwise.
   */
  reportValidity(): boolean;

  /**
   * Returns all invalid fields.
   */
  getInvalidFields(): Field<any, PluginOf<this>>[];

  /**
   * Subscribes to {@link validity the validity} changes of this field or any of its descendants.
   *
   * @param eventType The type of the event.
   * @param subscriber The subscriber that would be triggered.
   * @returns The callback to unsubscribe the subscriber.
   * @see {@link isInvalid}
   */
  on(eventType: 'change:validity', subscriber: Subscriber<ValidityState | null, PluginOf<this>>): Unsubscribe;
}

/**
 * A DOM element which supports Constraint validation API.
 */
export type ValidatableElement =
  | HTMLButtonElement
  | HTMLFieldSetElement
  | HTMLFormElement
  | HTMLInputElement
  | HTMLObjectElement
  | HTMLOutputElement
  | HTMLSelectElement
  | HTMLTextAreaElement;

/**
 * Enhances fields with
 * the [Constraint validation API.](https://developer.mozilla.org/en-US/docs/Web/API/Constraint_validation) methods.
 */
export function constraintValidationPlugin(): PluginInjector<ConstraintValidationPlugin> {
  return field => {
    const { ref } = field;

    field.validatedElement = null;
    field.validity = null;

    const isInvalid = Object.getOwnPropertyDescriptor(field, 'isInvalid')?.get;

    Object.defineProperty(field, 'isInvalid', {
      configurable: true,
      get: () => (isInvalid !== undefined && isInvalid()) || (field.validity !== null && !field.validity.valid),
    });

    const changeListener = () => {
      applyValidity(field);
    };

    field.on('change:value', changeListener);

    field.ref = nextElement => {
      const prevElement = field.validatedElement;

      ref?.(nextElement);

      if (prevElement === nextElement) {
        return;
      }

      field.validatedElement = nextElement = isValidatable(nextElement) ? nextElement : null;

      if (prevElement !== null) {
        prevElement.removeEventListener('input', changeListener);
        prevElement.removeEventListener('change', changeListener);
      }

      if (isValidatable(nextElement)) {
        nextElement.addEventListener('input', changeListener);
        nextElement.addEventListener('change', changeListener);
      }

      setTimeout(changeListener, 0);
    };

    field.getInvalidFields = () => getInvalidFields(field, []);

    field.reportValidity = () => reportValidity(field);
  };
}

function applyValidity(field: Field<unknown, ConstraintValidationPlugin>): void {
  const prevValidity = field.validity;
  const nextValidity = field.validatedElement !== null ? cloneValidity(field.validatedElement.validity) : null;

  if (!isEqualValidity(prevValidity, nextValidity)) {
    field.validity = nextValidity;

    dispatchEvents([{ type: 'change:validity', targetField: field, originField: field, data: prevValidity }]);
  }
}

function reportValidity(field: Field<unknown, ConstraintValidationPlugin>): boolean {
  if (field.children !== null) {
    for (const child of field.children) {
      if (!reportValidity(child)) {
        return false;
      }
    }
  }
  return field.validatedElement === null || field.validatedElement.reportValidity();
}

function getInvalidFields(
  field: Field<unknown, ConstraintValidationPlugin>,
  batch: Field<unknown, ConstraintValidationPlugin>[]
): Field<unknown, ConstraintValidationPlugin>[] {
  if (field.isInvalid) {
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

function isEqualValidity(a: ValidityState | null, b: ValidityState | null): boolean {
  if (a === null || b === null) {
    return a === b;
  }
  for (const key in a) {
    if (a[key as keyof ValidityState] !== b[key as keyof ValidityState]) {
      return false;
    }
  }
  return true;
}

function cloneValidity(validity: ValidityState): ValidityState {
  return {
    badInput: validity.badInput,
    customError: validity.customError,
    patternMismatch: validity.patternMismatch,
    rangeOverflow: validity.rangeOverflow,
    rangeUnderflow: validity.rangeUnderflow,
    stepMismatch: validity.stepMismatch,
    tooLong: validity.tooLong,
    tooShort: validity.tooShort,
    typeMismatch: validity.typeMismatch,
    valid: validity.valid,
    valueMissing: validity.valueMissing,
  };
}
