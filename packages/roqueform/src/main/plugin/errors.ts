import { Field, FieldEvent, FieldPlugin, InferMixin } from '../Field.js';
import { emptyObject, publishEvents } from '../utils.js';

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
export interface ErrorsMixin<Error = any> {
  /**
   * The array of errors associated with this field.
   */
  errors: readonly Error[];

  /**
   * `true` if this field has associated {@link errors}, or `false` otherwise.
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
 * Enhances the field with errors.
 *
 * @param concatErrors The callback that returns the new array of errors that includes the given error, or returns the
 * original errors array if there are no changes. By default, only identity-based-unique errors are added.
 * @template Error The error associated with the field.
 */
export default function errorsPlugin<Error = any>(
  /**
   * The callback that returns the new array of errors that includes the given error, or returns the original errors
   * array if there are no changes. By default, only identity-based-unique errors are added.
   *
   * @param errors The array of current errors.
   * @param error The new error to add.
   * @returns The new array of errors that includes the given error.
   * @template Error The error associated with the field.
   */
  concatErrors: (prevErrors: readonly Error[], error: Error) => readonly Error[] = concatUniqueErrors
): FieldPlugin<any, ErrorsMixin<Error>> {
  return field => {
    field.errors = [];

    Object.defineProperty(field, 'isInvalid', {
      configurable: true,

      get: () => field.errors.length !== 0,
    });

    field.addError = error => {
      const prevErrors = field.errors;
      const nextErrors = concatErrors(prevErrors, error);

      if (prevErrors === nextErrors) {
        return;
      }

      field.errors = nextErrors;

      field.publish(new FieldEvent('errorAdded', field, null, error));
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

      field.publish(new FieldEvent('errorDeleted', field, null, error));
    };

    field.clearErrors = options => {
      publishEvents(clearErrors(field, options || emptyObject, []));
    };

    field.getInvalidFields = () => getInvalidFields(field, []);

    field.subscribe(event => {
      if (event.type === 'errorCaught' && event.target === field) {
        field.addError(event.payload);
      }
    });
  };
}

function concatUniqueErrors<T>(prevErrors: readonly T[], error: T): readonly T[] {
  if (!prevErrors.includes(error)) {
    (prevErrors = prevErrors.slice(0)).push(error);
  }
  return prevErrors;
}

function clearErrors(
  field: Field<unknown, ErrorsMixin>,
  options: ClearErrorsOptions,
  events: FieldEvent[]
): FieldEvent[] {
  const prevErrors = field.errors;

  if (prevErrors.length !== 0) {
    field.errors = [];
    events.push(new FieldEvent('errorsCleared', field, null, prevErrors));
  }

  if (options.isRecursive) {
    for (const child of field.children) {
      clearErrors(child, options, events);
    }
  }

  return events;
}

function getInvalidFields(
  field: Field<unknown, ErrorsMixin>,
  batch: Field<unknown, ErrorsMixin>[]
): Field<unknown, ErrorsMixin>[] {
  if (field.isInvalid) {
    batch.push(field);
  }

  for (const child of field.children) {
    getInvalidFields(child, batch);
  }

  return batch;
}
