/**
 * Integrates Roqueform fields with the
 * [Constraint validation API](https://developer.mozilla.org/en-US/docs/Web/API/Constraint_validation).
 *
 * ```ts
 * import { createField } from 'roqueform';
 * import constraintValidationPlugin from 'roqueform/plugin/constraint-validation';
 *
 * const field = createField({ hello: 'world' }, [
 *   constraintValidationPlugin(),
 * ]);
 *
 * field.at('hello').ref(document.querySelector('input'));
 *
 * field.reportValidity();
 * ```
 *
 * @module plugin/constraint-validation
 */

import isDeepEqual from 'fast-deep-equal/es6/index.js';
import { Field, FieldPlugin, InferMixin } from '../FieldImpl.js';
import { overrideGetter } from '../utils.js';

/**
 * The mixin added to fields by the {@link constraintValidationPlugin}.
 */
export interface ConstraintValidationMixin {
  /**
   * The copy of the last reported [validity state](https://developer.mozilla.org/en-US/docs/Web/API/ValidityState)
   * read from the validated {@link element}.
   */
  validity: Readonly<ValidityState>;

  /**
   * The DOM element which constraints are tracked, or `null` if there's no associated element.
   */
  element: Element | null;

  /**
   * `true` if this field has {@link validity a validity issue}, or `false` otherwise.
   */
  readonly isInvalid: boolean;

  /**
   * Associates the field with the DOM {@link element}.
   */
  ref(element: Element | null): void;

  /**
   * Shows error message balloon for the first element that is associated with this field or any of its child fields,
   * that has an associated error via calling
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/reportValidity reportValidity}.
   *
   * @returns A field for which validity was reported, or `null` if there are no invalid fields.
   */
  reportValidity(): Field<any, InferMixin<this>> | null;

  /**
   * Returns all invalid fields.
   */
  getInvalidFields(): Field<any, InferMixin<this>>[];
}

/**
 * Enhances fields with
 * the [Constraint validation API](https://developer.mozilla.org/en-US/docs/Web/API/Constraint_validation) methods.
 */
export default function constraintValidationPlugin(): FieldPlugin<any, ConstraintValidationMixin> {
  return field => {
    const { ref } = field;

    const handleChange = () => checkValidity(field);

    field.validity = createValidity();

    field.element = null;

    overrideGetter(field, 'isInvalid', isInvalid => isInvalid || !field.validity.valid);

    field.ref = element => {
      field.element?.removeEventListener('input', handleChange);
      field.element = element;

      element?.addEventListener('input', handleChange);

      ref?.(element);

      checkValidity(field);
    };

    field.reportValidity = () => reportValidity(field);

    field.getInvalidFields = () => getInvalidFields(field, []);

    field.subscribe(event => {
      if (event.type === 'valueChanged' && event.target === field) {
        checkValidity(field);
      }
    });
  };
}

function checkValidity(field: Field<unknown, ConstraintValidationMixin>): void {
  const prevValidity = field.validity;
  const nextValidity = isValidatable(field.element) ? cloneValidity(field.element.validity) : createValidity();

  if (isDeepEqual(prevValidity, nextValidity)) {
    return;
  }

  field.validity = nextValidity;

  field.publish({ type: 'validityChanged', target: field, relatedTarget: null, payload: prevValidity });
}

function reportValidity(
  field: Field<unknown, ConstraintValidationMixin>
): Field<unknown, ConstraintValidationMixin> | null {
  if (isValidatable(field.element) && !field.element.reportValidity()) {
    return field;
  }

  return field.children.find(reportValidity) || null;
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
  return element !== null && element !== undefined && 'validity' in element;
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
    valid: true,
    valueMissing: false,
  };
}
