import { AnyType, Issue, Type } from 'doubter';
import { Field, Plugin, ValidationPlugin, validationPlugin } from 'roqueform';

/**
 * Enhances the field with validation methods that use [Doubter](https://github.com/smikhalevski/doubter) runtime
 * type definitions.
 *
 * @param type The type definition that is used for validation.
 * @template T The root field value.
 * @returns The plugin.
 */
export function doubterPlugin<T>(type: Type<T>): Plugin<T, ValidationPlugin<Partial<Issue>>> {
  const fieldTypeMap = new WeakMap<Field, AnyType | null>();

  return validationPlugin((targetField, applyError) => {
    const fieldType = getType(targetField, fieldTypeMap, type);

    if (fieldType === null) {
      return;
    }
    const issues = fieldType.validate(targetField.value);

    if (issues === null) {
      return;
    }
    issues: for (const issue of issues) {
      const { path } = issue;

      let field = targetField;

      for (let i = 0; i < path.length; ++i) {
        field = field.at(path[i]);

        if (field.transient) {
          continue issues;
        }
      }

      for (let field = targetField; field.parent !== null; field = field.parent) {
        path.unshift(field.key);
      }

      applyError(field, issue);
    }
  });
}

function getType(targetField: Field, fieldTypeMap: WeakMap<Field, AnyType | null>, rootType: AnyType): AnyType | null {
  if (targetField.parent === null) {
    return rootType;
  }
  let type = fieldTypeMap.get(targetField);

  if (type === null || type !== undefined) {
    return type;
  }
  const parentType = getType(targetField.parent, fieldTypeMap, rootType);

  if (parentType === null) {
    return null;
  }
  type = parentType.at(targetField.key);
  fieldTypeMap.set(targetField, type);
  return type;
}
