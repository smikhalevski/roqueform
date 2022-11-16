import { Accessor, Field, Plugin } from 'roqueform';
import { isEqual } from 'roqueform/src/main/utils';

/**
 * The enhancement added to fields by the {@linkcode resetPlugin}.
 */
export interface ResetPlugin<T> {
  /**
   * `true` if the field value is different from its initial value, or `false` otherwise.
   */
  readonly dirty: boolean;

  /**
   * Reverts the field to its initial value.
   */
  reset(): void;
}

/**
 * Enhances field with reset functionality.
 *
 * @template T The root field value.
 * @returns The plugin.
 */
export function resetPlugin<T>(
  equalityChecker: (initialValue: any, value: any) => boolean = isEqual
): Plugin<T, ResetPlugin<T>> {
  return (field, accessor) => {
    enhanceField(field, accessor, equalityChecker);
  };
}

function enhanceField(
  field: Field,
  accessor: Accessor,
  equalityChecker: (initialValue: any, value: any) => boolean
): void {
  const initialValue =
    field.parent === null ? field.value : accessor.get(getController(field.parent).__initialValue, field.key);

  const controller: FieldController = {
    __initialValue: initialValue,
  };

  Object.assign<Field, ResetPlugin>(field, {
    isDirty() {
      return !isEqual(initialValue, field.value);
    },
    reset() {
      field.dispatchValue(initialValue);
    },
  });
}
