import { Accessor, Field, Plugin } from 'roqueform';

export interface StatesPlugin<T> {
  /**
   * Returns `true` if the field value is different from the initial value, or `false` otherwise.
   *
   * **Note:** By default, field values are compared using reference equality. Pass an equality checker to
   * {@link statesPlugin} to alter this behavior.
   */
  isDirty(): boolean;

  /**
   * Reverts the field to its initial value.
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
 * @param [equalityChecker = Object.is] The field value equality checker.
 * @returns The plugin.
 */
export function statesPlugin<T>(equalityChecker: EqualityChecker = Object.is): Plugin<T, StatesPlugin<T>> {
  return (field, accessor) => enhanceField(field, accessor, equalityChecker);
}

const CONTROLLER_SYMBOL = Symbol('statesPlugin.controller');

/**
 * @internal
 * Retrieves a controller for the field instance.
 */
function getController(field: any): FieldController {
  return field[CONTROLLER_SYMBOL];
}

interface FieldController {
  __initialValue: unknown;
}

/**
 * @internal
 * Enhance fields with states methods.
 */
function enhanceField(field: Field, accessor: Accessor, equalityChecker: EqualityChecker): void {
  const initialValue =
    field.parent === null ? field.getValue() : accessor.get(getController(field.parent).__initialValue, field.key);

  const controller: FieldController = {
    __initialValue: initialValue,
  };

  Object.defineProperty(field, CONTROLLER_SYMBOL, { value: controller, enumerable: true });

  Object.assign<Field, StatesPlugin<unknown>>(field, {
    isDirty() {
      return !equalityChecker(initialValue, field.getValue());
    },
    reset() {
      field.dispatchValue(initialValue);
    },
  });
}
