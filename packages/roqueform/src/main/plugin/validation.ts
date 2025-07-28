/**
 * Enhances Roqueform fields with validation methods.
 *
 * ```ts
 * import { createField } from 'roqueform';
 * import validationPlugin from 'roqueform/plugin/validation';
 *
 * const field = createField({ hello: 'world' }, [
 *   validationPlugin(validation => {
 *     // Validate the field value here
 *   }),
 * ]);
 * ```
 *
 * @module plugin/validation
 */

import { Field, FieldEvent, FieldPlugin } from '../FieldImpl.js';
import { AbortError, isPromiseLike, overrideGetter, publishEvents } from '../utils.js';

/**
 * The mixin added to fields by the {@link validationPlugin}.
 *
 * @template Result The result produced by a validator.
 * @template Options Options passed to the validator.
 */
export interface ValidationMixin<Result, Options> {
  /**
   * The pending validation, or `null` if there's no pending validation.
   */
  validation: Validation<Result> | null;

  /**
   * `true` if the validation is pending, or `false` otherwise.
   */
  readonly isValidating: boolean;

  /**
   * Validates the value of the field and values of its {@link roqueform!FieldCore.isTransient non-transient}
   * descendants.
   *
   * If the field is already being {@link isValidating validated}, then the associated {@link validation}
   * {@link abortValidation is aborted} at the corresponding {@link Validation.field validation root}.
   *
   * @param options Options passed to {@link Validator the validator}.
   * @returns The validation result.
   */
  validate(options: Options): Result;

  /**
   * Aborts the validation associated with the field. No-op if there's no pending {@link validation}.
   */
  abortValidation(): void;
}

/**
 * The validation descriptor.
 *
 * @template Result The result produced by a validator.
 */
export interface Validation<Result> {
  /**
   * The field where the validation {@link ValidationMixin.validate was started}.
   */
  field: Field<any, ValidationMixin<Result, any>>;

  /**
   * The {@link field} value to validate.
   */
  value: any;

  /**
   * The controller that is aborted if validation must be finished prematurely.
   */
  abortController: AbortController;
}

/**
 * The validator callback to which the field value validation is delegated.
 *
 * Before marking the field as {@link ValidationMixin.isInvalid invalid}, check that the
 * {@link ValidationMixin.validation validation} didn't change to ensure that it wasn't aborted.
 *
 * @param validation The validation descriptor.
 * @param options Options passed to the {@link ValidationMixin.validate} method.
 * @template Result The validation result.
 * @template Options Options passed to the validator.
 */
export type Validator<Result, Options = void> = (validation: Validation<Result>, options: Options) => Result;

/**
 * Enhances the field with validation methods.
 *
 * This plugin is a scaffold for implementing validation. Check out
 * [library-based validation plugins](https://github.com/smikhalevski/roqueform#plugins-and-integrations) before
 * picking this plugin.
 *
 * @param validator The validator callback to which the field value validation is delegated.
 * @template Result The result produced by a validator.
 * @template Options Options passed to the validator.
 */
export default function validationPlugin<Result, Options = void>(
  validator: Validator<Result, Options>
): FieldPlugin<any, ValidationMixin<Result, Options>> {
  return field => {
    field.validation = field.parentField !== null ? field.parentField.validation : null;

    overrideGetter(field, 'isValidating', isValidating => isValidating || field.validation !== null);

    field.validate = options => {
      field.abortValidation();

      const abortController = new AbortController();

      const validation: Validation<Result> = { field: field, value: field.value, abortController };

      const finalize = () => {
        if (field.validation !== validation) {
          // Validation was superseded
          return;
        }
        publishEvents(finishValidation(field, validation, []));
      };

      abortController.signal.addEventListener('abort', finalize);

      publishEvents(startValidation(field, validation, []));

      let result;

      try {
        result = validator(validation, options);
      } catch (error) {
        publishEvents(finishValidation(field, validation, []));
        throw error;
      }

      if (field.validation !== validation) {
        // Validation was superseded
        return result;
      }

      if (!isPromiseLike(result)) {
        publishEvents(finishValidation(field, validation, []));
        return result;
      }

      // Prevent unhandled rejection
      result.then(finalize, finalize);

      return result;
    };

    field.abortValidation = () => {
      field.validation?.abortController.abort(AbortError('The field validation was aborted'));
    };
  };
}

function startValidation(
  field: Field<any, ValidationMixin<any, any>>,
  validation: Validation<any>,
  events: FieldEvent[]
): FieldEvent[] {
  if (field.validation !== null) {
    return events;
  }

  field.validation = validation;

  events.push({ type: 'validationStarted', target: field, relatedTarget: validation.field, payload: validation });

  for (const child of field.children) {
    if (!child.isTransient) {
      startValidation(child, validation, events);
    }
  }
  return events;
}

function finishValidation(
  field: Field<any, ValidationMixin<any, any>>,
  validation: Validation<any>,
  events: FieldEvent[]
): FieldEvent[] {
  if (field.validation !== validation) {
    return events;
  }

  field.validation = null;

  events.push({ type: 'validationFinished', target: field, relatedTarget: validation.field, payload: validation });

  for (const child of field.children) {
    finishValidation(child, validation, events);
  }
  return events;
}
