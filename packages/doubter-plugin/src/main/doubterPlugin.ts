import { AnyShape, Issue, ParseOptions, Shape } from 'doubter';
import { Field, Plugin, ValidationMixin, validationPlugin } from 'roqueform';

const anyShape = new Shape();

/**
 * The mixin added to fields by the {@linkcode doubterPlugin}.
 */
export interface DoubterMixin extends ValidationMixin<Issue, ParseOptions> {
  setError(error: Partial<Issue> | string): void;
}

/**
 * Enhances fields with validation methods powered by [Doubter](https://github.com/smikhalevski/doubter#readme).
 *
 * @param shape The shape that parses the field value.
 * @template T The root field value.
 */
export function doubterPlugin<T>(shape: Shape<T, any>): Plugin<DoubterMixin, T> {
  const plugin = createValidationPlugin(shape);

  return (field, accessor) => {
    plugin(field, accessor);

    const { setError } = field;

    field.setError = error => {
      if (typeof error === 'string') {
        error = { message: error };
      }
      if (error.code == null) {
        error.code = 'unknown';
      }
      if (error.path == null) {
        error.path = prependPath(field, []);
      }
      error.input = field.value;

      setError(error);
    };
  };
}

function createValidationPlugin(rootShape: AnyShape) {
  const shapeCache = new WeakMap<Field, AnyShape>();

  return validationPlugin<Issue, ParseOptions>({
    validate(field, setInternalError, options) {
      options = Object.assign({ verbose: true }, options);

      const result = getShape(field, shapeCache, rootShape).try(field.value, options);

      if (!result.ok) {
        setIssues(field, result.issues, setInternalError);
      }
    },

    validateAsync(field, setInternalError, options) {
      options = Object.assign({ verbose: true }, options);

      return getShape(field, shapeCache, rootShape)
        .tryAsync(field.value, options)
        .then(result => {
          if (!result.ok) {
            setIssues(field, result.issues, setInternalError);
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

function prependPath(field: Field, path: unknown[]): unknown[] {
  for (let ancestor = field; ancestor.parent !== null; ancestor = ancestor.parent) {
    path.unshift(ancestor.key);
  }
  return path;
}

function setIssues(field: Field, issues: Issue[], setInternalError: (field: Field, error: Issue) => void): void {
  for (const issue of issues) {
    const { path } = issue;

    let targetField = field;

    for (let i = 0; i < path.length; ++i) {
      targetField = targetField.at(path[i]);
    }
    prependPath(field, path);
    setInternalError(targetField, issue);
  }
}
