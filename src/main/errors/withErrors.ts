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

    let prevInvalid = errors.has(targetField);

    const field = Object.assign<Field, WithErrors<T>>(targetField, {

      invalid: prevInvalid,
      error: errors.get(targetField),

      setError(error) {
        errors.set(field, error);
      },
      clearError() {
        errors.delete(field);
      },
    });

    errors.subscribe(() => {
      const invalid = errors.has(field);

      if (prevInvalid === invalid) {
        return;
      }

      field.invalid = prevInvalid = invalid;
      field.error = errors.get(field);

      field.notify();
    });

    return field;
  };
}
