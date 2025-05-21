import isDeepEqual from 'fast-deep-equal/es6/index.js';
import { Field, FieldPlugin, InferMixin } from '../Field.js';
import { createObservableRef, Ref } from '../utils.js';

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
  ref: Ref<Element | null>;

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

/**
 * Enhances fields with
 * the [Constraint validation API.](https://developer.mozilla.org/en-US/docs/Web/API/Constraint_validation) methods.
 */
export function constraintValidationPlugin(): FieldPlugin<any, ConstraintValidationMixin> {
  return field => {
    Object.defineProperty(field, 'isInvalid', {
      configurable: true,

      get: () => field.validity.valid,
    });

    const ref = createObservableRef<Element | null>(null);

    field.ref = ref;

    field.validity = createValidity();

    field.getInvalidFields = () => getInvalidFields(field, []);

    field.reportValidity = () => reportValidity(field);

    field.subscribe(event => {
      if (event.type === 'valueChanged' && event.target === field) {
        checkValidity(field);
      }
    });

    const handleChange = () => checkValidity(field);

    ref._subscribe(event => {
      const { prevValue, nextValue } = event;

      if (prevValue !== null) {
        prevValue.removeEventListener('input', handleChange);
      }
      if (nextValue !== null) {
        nextValue.addEventListener('input', handleChange);
      }
    });
  };
}

function checkValidity(field: Field<unknown, ConstraintValidationMixin>): void {
  if (!isValidatable(field.ref.current)) {
    return;
  }

  const prevValidity = field.validity;
  const nextValidity = cloneValidity(field.ref.current.validity);

  if (isDeepEqual(prevValidity, nextValidity)) {
    return;
  }

  field.validity = nextValidity;

  field.publish({ type: 'validityChanged', target: field, relatedTarget: null, payload: prevValidity });
}

function reportValidity(field: Field<unknown, ConstraintValidationMixin>): boolean {
  for (const child of field.children) {
    if (!reportValidity(child)) {
      return false;
    }
  }

  return !isValidatable(field.ref.current) || field.ref.current.reportValidity();
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

function isValidatable(element: Element | null): element is HTMLInputElement {
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
