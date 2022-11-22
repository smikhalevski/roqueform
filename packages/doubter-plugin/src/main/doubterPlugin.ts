import { AnyShape, Issue, ParseOptions } from 'doubter';
import { Field, Plugin, ValidationPlugin, validationPlugin } from 'roqueform';

/**
 * Enhances fields with validation methods powered by [Doubter](https://github.com/smikhalevski/doubter#readme).
 *
 * @param shape The shape that parses the field value.
 * @template S The shape that parses the field value.
 * @returns The validation plugin.
 */
export function doubterPlugin<S extends AnyShape>(
  shape: S
): Plugin<S['input'], ValidationPlugin<S['output'], Partial<Issue>, ParseOptions>> {
  const shapeMap = new WeakMap<Field, AnyShape | null>();

  return validationPlugin({
    validate(field, setInternalError, options) {
      const fieldShape = getShapeForField(field, shapeMap, shape);

      if (fieldShape === null) {
        return { ok: true, value: field.value };
      }

      const result = fieldShape.try(field.value, Object.assign({ verbose: true }, options));

      if (result.ok) {
        return result;
      }

      setIssues(field, result.issues, setInternalError);

      return { ok: false, errors: result.issues };
    },

    validateAsync(field, setInternalError, options) {
      const fieldShape = getShapeForField(field, shapeMap, shape);

      if (fieldShape === null) {
        return Promise.resolve({ ok: true, value: field.value });
      }

      return fieldShape.tryAsync(field.value, Object.assign({ verbose: true }, options)).then(result => {
        if (result.ok) {
          return result;
        }

        setIssues(field, result.issues, setInternalError);

        return { ok: false, errors: result.issues };
      });
    },
  });
}

/**
 * Returns a shape that should be used to validate field.
 *
 * @param field The field to validate.
 * @param shapeMap Cached shapes.
 * @param shape The shape of the root field.
 * @returns The shape or `null` if there's no shape for the field.
 */
function getShapeForField(field: Field, shapeMap: WeakMap<Field, AnyShape | null>, shape: AnyShape): AnyShape | null {
  if (field.parent === null) {
    return shape;
  }

  let fieldShape = shapeMap.get(field);

  if (fieldShape === null || fieldShape !== undefined) {
    return fieldShape;
  }

  const parentShape = getShapeForField(field.parent, shapeMap, shape);

  if (parentShape === null) {
    return null;
  }

  fieldShape = parentShape.at(field.key);
  shapeMap.set(field, fieldShape);

  return fieldShape;
}

function setIssues(targetField: Field, issues: Issue[], setInternalError: (field: Field, error: Issue) => void): void {
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

    setInternalError(field, issue);
  }
}
