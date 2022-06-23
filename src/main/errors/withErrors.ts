import {Errors} from './Errors';
import {Enhancer} from '../Field';

export interface WithErrors<T = any> {

  error: T | undefined;
  invalid: boolean;

  setError(error: T): void;

  clearError(): void;
}

export function withErrors<T>(errors: Errors<T>): Enhancer<WithErrors<T>> {
  return (field: any) => {

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
