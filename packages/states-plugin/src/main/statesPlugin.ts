import { Field, Plugin } from 'roqueform';

export interface StatesPlugin {
  /**
   * Returns `true` if the field value or derived fields are different from the value it was initialized with. `false` otherwise.
   *
   * **Note:**
   * Comparison is done with reference-equals.
   * For the detecting dirty, fields need to be created and initialized before first dispatch value.
   */
  isDirty(): boolean;

  /**
   * Recursively deletes dirty flags associated with this field and all of its derived fields.
   * Also resets values to initial ones.
   */
  reset(): void;
}

/**
 * Returns truthy result if values are equal, and falsy result otherwise.
 */
export type EqualityChecker = (left: any, right: any) => any;

/**
 * Enhance field with states methods.
 *
 * @param equalityChecker The equality checker. By default, a reference equality checker is used.
 * @returns The plugin.
 */
export function statesPlugin(equalityChecker: EqualityChecker = Object.is): Plugin<any, StatesPlugin> {
  return field => enhanceField(field, equalityChecker);
}

/**
 * @internal
 * Enhance fields with states methods.
 *
 * @param field
 * @param equalityChecker
 */
function enhanceField(field: Field, equalityChecker: EqualityChecker): void {
  const initialValue = field.getValue();

  Object.assign<Field, StatesPlugin>(field, {
    isDirty() {
      return !equalityChecker(initialValue, field.getValue());
    },
    reset() {
      field.dispatchValue(initialValue);
    },
  });
}
