/**
 * Enhances Roqueform fields with error management methods.
 *
 * ```ts
 * import { createField } from 'roqueform';
 * import errorsPlugin from 'roqueform/plugin/errors';
 *
 * const field = createField({ hello: 'world' }, [errorsPlugin()]);
 *
 * field.addError('Invalid value');
 *
 * field.isInvalid; // ⮕ true
 * ```
 *
 * @module plugin/errors
 */

import { Field, FieldEvent, FieldPlugin, InferMixin } from '../FieldImpl.js';
import { collectFields, isObjectLike, overrideGetter, publishEvents } from '../utils.js';

/**
 * Options of the {@link ErrorsMixin.clearErrors} method.
 */
export interface ClearErrorsOptions {
  /**
   * If `true` then errors are deleted for this field and all of its descendant fields.
   *
   * @default false
   */
  isRecursive?: boolean;
}

/**
 * The mixin added to the field by the {@link errorsPlugin}.
 *
 * @template Error The error associated with the field.
 */
export interface ErrorsMixin<Error> {
  /**
   * The array of errors associated with this field.
   */
  errors: readonly Error[];

  /**
   * `true` if this field has associated {@link errors}, or `false` otherwise.
   *
   * **Note:** Use {@link getInvalidFields} to check that this field or any of its descendants are invalid.
   */
  readonly isInvalid: boolean;

  /**
   * Associates an error with the field.
   *
   * @param error The error to add.
   */
  addError(error: Error): void;

  /**
   * Deletes an error associated with this field. No-op if an error isn't associated with this field.
   *
   * @param error The error to delete.
   */
  deleteError(error: Error): void;

  /**
   * Deletes all errors associated with this field.
   */
  clearErrors(options?: ClearErrorsOptions): void;

  /**
   * Returns all fields that have associated errors.
   */
  getInvalidFields(): Field<any, InferMixin<this>>[];
}

/**
 * Enhances fields with error management methods.
 *
 * @param concatErrors The callback that returns the new array of errors that includes the given error, or returns
 * the original errors array if there are no changes. By default, if an error is an object that has the `message` field,
 * it is added only the `message` value is distinct; otherwise, if an error isn't an object or doesn't have the
 * `message` field, it is added only if it has a unique identity.
 * @template Error The error associated with the field.
 */
export default function errorsPlugin<Error = unknown>(
  concatErrors = fuzzyConcatErrors<Error>
): FieldPlugin<any, ErrorsMixin<Error>> {
  return field => {
    field.errors = [];

    overrideGetter(field, 'isInvalid', isInvalid => isInvalid || field.errors.length !== 0);

    field.addError = error => {
      const prevErrors = field.errors;
      const nextErrors = concatErrors(prevErrors, error);

      if (prevErrors === nextErrors) {
        return;
      }

      field.errors = nextErrors;

      field.publish({ type: 'errorAdded', target: field, relatedTarget: null, payload: error });
    };

    field.deleteError = error => {
      const prevErrors = field.errors;
      const errorIndex = prevErrors.indexOf(error);

      if (errorIndex === -1) {
        return;
      }

      const nextErrors = prevErrors.slice(0);
      nextErrors.splice(errorIndex, 1);
      field.errors = nextErrors;

      field.publish({ type: 'errorDeleted', target: field, relatedTarget: null, payload: error });
    };

    field.clearErrors = options => publishEvents(clearErrors(field, options, []));

    field.getInvalidFields = () => collectFields(field, field => field.isInvalid, []);

    field.subscribe(event => {
      if (event.type === 'errorDetected' && event.target === field) {
        field.addError(event.payload);
      }
    });
  };
}

/**
 * The callback that returns a new array of errors that includes the given error, or returns the `prevErrors` as if
 * there are no changes.
 *
 * @param prevErrors The array of existing errors.
 * @param error The new error to add.
 * @returns The array of errors that includes the given error.
 * @template Error The error associated with the field.
 */
function fuzzyConcatErrors<T>(prevErrors: readonly T[], error: T): readonly T[] {
  for (const prevError of prevErrors) {
    if (Object.is(error, prevError)) {
      // Not unique
      return prevErrors;
    }

    if (
      isObjectLike(error) &&
      isObjectLike(prevError) &&
      error.message !== undefined &&
      error.message === prevError.message
    ) {
      // Not distinct
      return prevErrors;
    }
  }

  return [...prevErrors, error];
}

function clearErrors(
  field: Field<unknown, ErrorsMixin<unknown>>,
  options: ClearErrorsOptions | undefined,
  events: FieldEvent[]
): FieldEvent[] {
  const prevErrors = field.errors;

  if (prevErrors.length !== 0) {
    field.errors = [];

    events.push({ type: 'errorsCleared', target: field, relatedTarget: null, payload: prevErrors });
  }

  if (options !== undefined && options.isRecursive) {
    for (const child of field.children) {
      clearErrors(child, options, events);
    }
  }

  return events;
}
