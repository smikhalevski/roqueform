import isDeepEqual from 'fast-deep-equal/es6/index.js';
import { Field, FieldEvent, FieldPlugin, InferMixin } from '../Field.js';

/**
 * The mixin added to fields by the {@link constraintValidationPlugin}.
 */
export interface ConstraintValidationMixin {
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
  getInvalidFields(): Field<any, InferMixin<this>>[];
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
export function constraintValidationPlugin(): FieldPlugin<any, ConstraintValidationMixin> {
  return field => {
    const { ref } = field;

    const valueChangeListener = () => {
      applyValidity(field);
    };

    field.validatedElement = null;
    field.validity = null;

    Object.defineProperty(field, 'isInvalid', {
      configurable: true,

      get: () => field.validity !== null && !field.validity.valid,
    });

    field.ref = nextElement => {
      const prevElement = field.validatedElement;

      ref?.(nextElement);

      if (prevElement === nextElement) {
        return;
      }

      field.validatedElement = nextElement = isValidatable(nextElement) ? nextElement : null;

      if (prevElement !== null) {
        prevElement.removeEventListener('input', valueChangeListener);
        prevElement.removeEventListener('change', valueChangeListener);
      }

      if (isValidatable(nextElement)) {
        nextElement.addEventListener('input', valueChangeListener);
        nextElement.addEventListener('change', valueChangeListener);
      }

      setTimeout(valueChangeListener, 0);
    };

    field.getInvalidFields = () => getInvalidFields(field, []);

    field.reportValidity = () => reportValidity(field);

    field.subscribe(event => {
      if (event.type === 'valueChanged' && event.target === field) {
        valueChangeListener();
      }
    });
  };
}

function applyValidity(field: Field<unknown, ConstraintValidationMixin>): void {
  const prevValidity = field.validity;
  const nextValidity = field.validatedElement !== null ? cloneValidity(field.validatedElement.validity) : null;

  if (isDeepEqual(prevValidity, nextValidity)) {
    return;
  }

  field.validity = nextValidity;

  field.publish(new FieldEvent('validityChanged', field, null, prevValidity));
}

function reportValidity(field: Field<unknown, ConstraintValidationMixin>): boolean {
  for (const child of field.children) {
    if (!reportValidity(child)) {
      return false;
    }
  }

  return field.validatedElement === null || field.validatedElement.reportValidity();
}

function getInvalidFields(
  field: Field<unknown, ConstraintValidationMixin>,
  batch: Field<unknown, ConstraintValidationMixin>[]
): Field<unknown, ConstraintValidationMixin>[] {
  if (field.isInvalid) {
    batch.push(field);
  }

  for (const child of field.children) {
    getInvalidFields(child, batch);
  }

  return batch;
}

function isValidatable(element: Element | null): element is ValidatableElement {
  return element instanceof Element && 'validity' in element && element.validity instanceof ValidityState;
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
