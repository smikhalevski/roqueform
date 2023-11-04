import { AnyShape, Issue, ParseOptions, Shape } from 'doubter';
import { Field, Plugin, ValidationMixin, validationPlugin } from 'roqueform';

const anyShape = new Shape();

/**
 * The mixin added to fields by the {@link doubterPlugin}.
 */
export interface DoubterMixin extends ValidationMixin<Issue, ParseOptions> {
  setError(error: Issue | string): void;
}

/**
 * Enhances fields with validation methods powered by [Doubter](https://github.com/smikhalevski/doubter#readme).
 *
 * @param shape The shape that parses the field value.
 * @template Value The root field value.
 */
export function doubterPlugin<Value>(shape: Shape<Value, any>): Plugin<DoubterMixin, Value> {
  let plugin: Plugin<any>;

  return (field, accessor, notify) => {
    (plugin ||= createValidationPlugin(shape))(field, accessor, notify);

    const { setError } = field;

    field.setError = error => {
      if (typeof error === 'string') {
        error = { message: error };
      }
      error.path = prependPath(field, error.path);
      error.input = field.value;

      setError(error);
    };
  };
}

function createValidationPlugin(rootShape: AnyShape) {
  const shapeCache = new WeakMap<Field, AnyShape>();

  return validationPlugin<Issue, ParseOptions>({
    validate(field, setError, options) {
      options = Object.assign({ verbose: true }, options);

      const result = getShape(field, shapeCache, rootShape).try(field.value, options);

      if (!result.ok) {
        setIssues(field, result.issues, setError);
      }
    },

    validateAsync(field, setError, options) {
      options = Object.assign({ verbose: true }, options);

      return getShape(field, shapeCache, rootShape)
        .tryAsync(field.value, options)
        .then(result => {
          if (!result.ok) {
            setIssues(field, result.issues, setError);
          }
        });
    },
  });
}

function getShape(field: Field, shapeCache: WeakMap<Field, AnyShape>, rootShape: AnyShape): AnyShape {
  let shape = shapeCache.get(field);

  if (shape === undefined) {
    shape = field.parent === null ? rootShape : getShape(field.parent, shapeCache, rootShape).at(field.key) || anyShape;
    shapeCache.set(field, shape);
  }
  return shape;
}

function prependPath(field: Field, path: unknown[] | undefined): unknown[] | undefined {
  for (let ancestor = field; ancestor.parent !== null; ancestor = ancestor.parent) {
    (path ||= []).unshift(ancestor.key);
  }
  return path;
}

function setIssues(field: Field, issues: Issue[], setError: (field: Field, error: Issue) => void): void {
  for (const issue of issues) {
    let targetField = field;

    if (Array.isArray(issue.path)) {
      for (const key of issue.path) {
        targetField = targetField.at(key);
      }
    }

    issue.path = prependPath(field, issue.path);
    setError(targetField, issue);
  }
}
