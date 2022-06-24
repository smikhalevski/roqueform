import {Errors} from './Errors';
import {Enhancer, Field} from '../Field';

export interface WithErrors<T = any> {

  /**
   * `true` if the field has an error.
   */
  invalid: boolean;

  /**
   * An error associated with this field, or `undefined` if there's no error.
   */
  error: T | undefined;

  /**
   * Associates the error with this field.
   *
   * @param error The error to set.
   */
  setError(error: T): void;

  /**
   * Clear the error associated with this field.
   */
  clearError(): void;
}

/**
 * Enhances the field with the error-related properties.
 *
 * @param errors The map that associates field and a validation error.
 */
export function withErrors<T>(errors: Errors<T>): Enhancer<WithErrors<T>> {
  return (targetField) => {

    let invalid = errors.has(targetField);
    let error = errors.get(targetField);

    const field = Object.assign<Field, WithErrors<T>>(targetField, {

      invalid,
      error,

      setError(error) {
        errors.set(field, error);
      },
      clearError() {
        errors.delete(field);
      },
    });

    errors.subscribe(() => {

      const nextInvalid = errors.has(field);
      const nextError = errors.get(field);

      if (invalid === nextInvalid && error === nextError) {
        return;
      }

      field.invalid = invalid = nextInvalid;
      field.error = error = nextError;

      field.notify();
    });

    return field;
  };
}
