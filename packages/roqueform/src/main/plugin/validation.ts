/**
 * Enhances Roqueform fields with validation methods.
 *
 * ```ts
 * import { createField } from 'roqueform';
 * import validationPlugin from 'roqueform/plugin/validation';
 *
 * const field = createField({ hello: 'world' }, [
 *   validationPlugin((validation, options) => {
 *     // Validate the field value here
 *   }),
 * ]);
 *
 * field.validate();
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
  abortValidation(reason?: unknown): void;
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
  field: Field<any, ValidationMixin<Result, unknown>>;

  /**
   * The controller that is {@link ValidationMixin.abortValidation aborted} if validation must be finished prematurely.
   */
  abortController: AbortController;
}

/**
 * The validator callback to which the field value validation is delegated.
 *
 * **Note:** Before marking a field as invalid, be sure to check that it has the same
 * {@link ValidationMixin.validation validation} as the one passed to a validator.
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

      const validation: Validation<Result> = { field, abortController };

      const cleanup = () => {
        if (field.validation !== validation) {
          // Validation was superseded
          return;
        }
        publishEvents(finishValidation(field, validation, []));
      };

      abortController.signal.addEventListener('abort', cleanup);

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
      result.then(cleanup, cleanup);

      return result;
    };

    field.abortValidation = (reason = AbortError('The field validation was aborted')) => {
      field.validation?.abortController.abort(reason);
    };
  };
}

function startValidation(
  field: Field<unknown, ValidationMixin<unknown, unknown>>,
  validation: Validation<unknown>,
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
  field: Field<unknown, ValidationMixin<unknown, unknown>>,
  validation: Validation<unknown>,
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
