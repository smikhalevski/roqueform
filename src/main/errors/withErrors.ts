import {Errors} from './Errors';
import {Enhancer, Field} from '../Field';

export interface WithErrors<T = any> {
  error: T | undefined;
  invalid: boolean;

  setError(error: T): void;
  clearError(): void;
}

export function withErrors<T>(errors: Errors<T>): Enhancer<WithErrors<T>> {
  return (field) => {

    Object.assign(field, {
      setError(error: T) {
        errors.set(field, error)
      },
      clearError() {
        errors.delete(field);
      },
    });

    Object.defineProperties(field, {
      error: {
        get: () => errors.get(field),
      },
      invalid: {
        get: () => errors.has(field),
      },
    });

    return field as Field & WithErrors;
  };
}
