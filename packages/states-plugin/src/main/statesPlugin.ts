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
 * By default, comparison is done with reference-equals.
 *
 * Used for detecting is field dirty.
 */
export type EqualityChecker = (left: any, right: any) => any;

/**
 * Enhance field with states methods.
 *
 * @param equalityChecker The equality checker @see {@link EqualityChecker}
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
  const controller: FieldController = {
    __initialValue: undefined,
  };

  controller.__initialValue = field.getValue();

  Object.assign<Field, StatesPlugin>(field, {
    isDirty() {
      return !equalityChecker(controller.__initialValue, field.getValue());
    },
    reset() {
      field.dispatchValue(controller.__initialValue);
    },
  });
}

/**
 * @internal
 * The field controller that holds initial value of the field.
 */
interface FieldController {
  __initialValue: unknown;
}
