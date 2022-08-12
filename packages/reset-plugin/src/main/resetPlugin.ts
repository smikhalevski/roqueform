import { Accessor, Field, Plugin } from 'roqueform';

/**
 * The mixin added to fields by {@link resetPlugin}.
 */
export interface ResetPlugin {
  /**
   * Returns `true` if the field value is different from the initial value, or `false` otherwise.
   *
   * **Note:** By default, field values are compared using reference equality. Pass an equality checker to
   * {@link resetPlugin} to alter this behavior.
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
 * Enhance field with `reset` and `isDirty` methods.
 *
 * @param equalityChecker The field value equality checker. Defaults to `Object.is`.
 * @template T The root field value.
 * @returns The plugin.
 */
export function resetPlugin<T>(equalityChecker: EqualityChecker = Object.is): Plugin<T, ResetPlugin> {
  return (field, accessor) => {
    enhanceField(field, accessor, equalityChecker);
  };
}

/**
 * @internal
 * The property that holds a controller instance.
 *
 * **Note:** Controller isn't intended to be accessed outside the plugin internal functions.
 */
const CONTROLLER_SYMBOL = Symbol('resetPlugin.controller');

/**
 * @internal
 * Retrieves a controller for the field instance.
 */
function getController(field: any): FieldController {
  return field[CONTROLLER_SYMBOL];
}

/**
 * @internal
 */
interface FieldController {
  __initialValue: unknown;
}

/**
 * @internal
 */
function enhanceField(field: Field, accessor: Accessor, equalityChecker: EqualityChecker): void {
  const initialValue =
    field.parent === null ? field.value : accessor.get(getController(field.parent).__initialValue, field.key);

  const controller: FieldController = {
    __initialValue: initialValue,
  };

  Object.defineProperty(field, CONTROLLER_SYMBOL, { value: controller, enumerable: true });

  Object.assign<Field, ResetPlugin>(field, {
    isDirty() {
      return !equalityChecker(initialValue, field.value);
    },
    reset() {
      field.dispatchValue(initialValue);
    },
  });
}
