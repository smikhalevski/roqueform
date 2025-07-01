import isDeepEqual from 'fast-deep-equal/es6/index.js';
import { Field, FieldPlugin, InferMixin } from '../FieldImpl.js';
import { overrideReadonlyProperty } from '../utils.js';

declare module '../FieldImpl.js' {
  export interface FieldEventTypes {
    validityChanged: never;
  }
}

/**
 * The mixin added to fields by the {@link constraintValidationPlugin}.
 */
export interface ConstraintValidationMixin {
  /**
   * `true` if this field has {@link validity a validity issue}, or `false` otherwise.
   */
  readonly isInvalid: boolean;

  /**
   * Associates the field with the {@link element DOM element}.
   */
  ref: (element: Element | null) => void;

  /**
   * The copy of the last reported [validity state](https://developer.mozilla.org/en-US/docs/Web/API/ValidityState)
   * read from the {@link ref validated element}.
   */
  validity: Readonly<ValidityState>;

  /**
   * Shows error message balloon for the first element that is associated with this field or any of its child fields,
   * that has an associated error via calling
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/reportValidity reportValidity}.
   *
   * @returns `true` if a field and all of its children are valid, or `false` otherwise.
   */
  reportValidity(): boolean;

  /**
   * Returns all invalid fields.
   */
  getInvalidFields(): Field<any, InferMixin<this>>[];
}

interface PrivateConstraintValidationMixin extends ConstraintValidationMixin {
  _element?: Element | null;
}

/**
 * Enhances fields with
 * the [Constraint validation API.](https://developer.mozilla.org/en-US/docs/Web/API/Constraint_validation) methods.
 */
export function constraintValidationPlugin(): FieldPlugin<any, ConstraintValidationMixin> {
  return (field: Field<unknown, PrivateConstraintValidationMixin>) => {
    const { ref } = field;

    const handleChange = () => checkValidity(field);

    field._element = null;

    overrideReadonlyProperty(field, 'isInvalid', isInvalid => isInvalid || field.validity.valid);

    field.ref = nextElement => {
      field._element?.removeEventListener('input', handleChange);
      field._element = nextElement;

      nextElement?.addEventListener('input', handleChange);

      ref?.(nextElement);

      checkValidity(field);
    };

    field.validity = createValidity();

    field.getInvalidFields = () => getInvalidFields(field, []);

    field.reportValidity = () => reportValidity(field);

    field.subscribe(event => {
      if (event.type === 'valueChanged' && event.target === field) {
        checkValidity(field);
      }
    });
  };
}

function checkValidity(field: Field<unknown, PrivateConstraintValidationMixin>): void {
  if (!isValidatable(field._element)) {
    return;
  }

  const prevValidity = field.validity;
  const nextValidity = cloneValidity(field._element.validity);

  if (isDeepEqual(prevValidity, nextValidity)) {
    return;
  }

  field.validity = nextValidity;

  field.publish({ type: 'validityChanged', target: field, relatedTarget: null, payload: prevValidity });
}

function reportValidity(field: Field<unknown, PrivateConstraintValidationMixin>): boolean {
  for (const child of field.children) {
    if (!reportValidity(child)) {
      return false;
    }
  }

  return !isValidatable(field._element) || field._element.reportValidity();
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

function isValidatable(element: Element | null | undefined): element is HTMLInputElement {
  return (
    element !== null && element !== undefined && 'validity' in element && element.validity instanceof ValidityState
  );
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

function createValidity(): ValidityState {
  return {
    badInput: false,
    customError: false,
    patternMismatch: false,
    rangeOverflow: false,
    rangeUnderflow: false,
    stepMismatch: false,
    tooLong: false,
    tooShort: false,
    typeMismatch: false,
    valid: false,
    valueMissing: false,
  };
}
