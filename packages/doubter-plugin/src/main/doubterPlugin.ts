import { Type } from 'doubter';
import { Field, Plugin } from 'roqueform';

/**
 * An error added to the field.
 */
export interface FieldError {
  /**
   * An error code that uniquely identifies the error.
   */
  code?: string;

  /**
   * The field value that caused an error.
   */
  value?: any;

  /**
   * The human-readable message.
   */
  message?: string;

  /**
   * The error param specific to a particular error code.
   */
  param?: any;

  /**
   * The additional error metadata.
   */
  meta?: any;
}

export interface DoubterPlugin<T> {
  /**
   * Returns `true` if the field has an error, or `false` otherwise.
   */
  isInvalid(): boolean;

  /**
   * An error associated with the field.
   */
  getError(): FieldError | null;

  /**
   * Sets an error for the field and notifies the subscribers.
   *
   * @param error The error to set.
   */
  setError(error: FieldError): void;

  /**
   * Removes an error from the field and notifies the subscribers.
   */
  clearError(): void;

  /**
   * Triggers field validation. If the field has a parent then validation is delegated to the parent.
   */
  validate(): void;
}

type DoubterField = Field<any, DoubterPlugin<any>> & DoubterPlugin<any>;

/**
 * Enhances the field with validation mechanism through a {@link https://github.com/smikhalevski/doubter Doubter}
 * runtime types.
 *
 * @param type The type that is used for validation.
 */
export function doubterPlugin<T>(type: Type<T>): Plugin<T, DoubterPlugin<T>> {
  return originalField => {
    let error: FieldError | null = null;

    const validate = (): void => {
      if (field !== rootField) {
        rootField.validate();
        return;
      }

      const issues = type.validate(rootField.getValue());

      if (issues === null) {
        invalidFields?.forEach(clearStaleError);
        invalidFields = null;
        return;
      }

      const nextInvalidFields = new Map<DoubterField, FieldError>();

      for (const issue of issues) {
        const field = getFieldAt(rootField, issue.path);

        if (nextInvalidFields.has(field)) {
          continue;
        }

        const error: FieldError = {
          code: issue.code,
          value: issue.input,
          message: issue.message,
          param: issue.param,
          meta: issue.meta,
        };

        nextInvalidFields.set(field, error);
        field.setError(error);
      }

      invalidFields?.forEach(clearStaleError);
      invalidFields = nextInvalidFields;
    };

    const getError = () => error;

    const isInvalid = () => error !== null;

    const setError = (nextError: FieldError): void => {
      error = nextError;
      field.notify();
    };

    const clearError = (): void => {
      error = null;
      field.notify();
    };

    const field = Object.assign<Field<T, any>, DoubterPlugin<T>>(originalField, {
      isInvalid,
      getError,
      setError,
      clearError,
      validate,
    });

    let invalidFields: Map<DoubterField, FieldError> | null = null;
    let rootField = field;

    for (let parent: DoubterField | null = field; parent !== null; parent = parent.parent) {
      rootField = parent;
    }

    return field;
  };
}

function clearStaleError(error: FieldError, field: DoubterField): void {
  if (error === field.getError()) {
    field.clearError();
  }
}

function getFieldAt(field: DoubterField, path: any[]): DoubterField {
  for (const key of path) {
    field = field.at(key);
  }
  return field;
}
