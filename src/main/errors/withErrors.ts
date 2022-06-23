import {Errors} from './Errors';
import {Enhancer} from '../Field';

export interface WithErrors<T = any> {

  /**
   * An error associated with this field, or `undefined` if there's no error.
   */
  readonly error: T | undefined;

  /**
   * `true` if the field has an error.
   */
  readonly invalid: boolean;

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
  return (field: any) => {

    errors.subscribe((targetField) => {
      if (targetField === field) {
        field.notify();
      }
    });

    field.setError = (error: T) => {
      errors.set(field, error);
    };

    field.clearError = () => {
      errors.delete(field);
    };

    Object.defineProperties(field, {
      error: {
        get: () => errors.get(field),
      },
      invalid: {
        get: () => errors.has(field),
      },
    });

    return field;
  };
}
