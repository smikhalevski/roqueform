import { Err, Issue, Ok, ParseOptions, Shape } from 'doubter';
import { AnyField, Field, PluginInjector, Validation, ValidationPlugin, validationPlugin, Validator } from 'roqueform';

/**
 * The plugin added to fields by the {@link doubterPlugin}.
 */
export interface DoubterPlugin extends ValidationPlugin<Issue, ParseOptions> {
  /**
   * The shape that Doubter uses to validate {@link FieldController.value the field value}, or `null` if there's no
   * shape for this field.
   *
   * @protected
   */
  ['shape']: Shape | null;

  setError(error: Issue | string | null | undefined): void;
}

/**
 * Enhances fields with validation methods powered by [Doubter](https://github.com/smikhalevski/doubter#readme).
 *
 * @param shape The shape that parses the field value.
 * @template Value The root field value.
 */
export function doubterPlugin<Value>(shape: Shape<Value, any>): PluginInjector<DoubterPlugin, Value> {
  let plugin;

  return field => {
    (plugin ||= validationPlugin(doubterValidator))(field);

    field.shape = field.parent === null ? shape : field.parent.shape?.at(field.key) || null;

    const { setError } = field;

    field.setError = error => {
      setError(typeof error === 'string' ? { message: error, path: getPath(field) } : error);
    };
  };
}

const doubterValidator: Validator<Issue, ParseOptions> = {
  validate(field, options) {
    const { validation, shape } = field as unknown as Field<DoubterPlugin>;

    if (validation !== null && shape !== null) {
      applyResult(validation, shape.try(field.value, Object.assign({ verbose: true }, options)));
    }
  },

  validateAsync(field, options) {
    const { validation, shape } = field as unknown as Field<DoubterPlugin>;

    if (validation !== null && shape !== null) {
      return shape.tryAsync(field.value, Object.assign({ verbose: true }, options)).then(result => {
        applyResult(validation, result);
      });
    }

    return Promise.resolve();
  },
};

function getPath(field: AnyField): any[] {
  const path = [];

  while (field.parent !== null) {
    path.unshift(field.key);
    field = field.parent;
  }
  return path;
}

function applyResult(validation: Validation<DoubterPlugin>, result: Err | Ok): void {
  if (result.ok) {
    return;
  }

  const basePath = getPath(validation.root);

  for (const issue of result.issues) {
    let child = validation.root;

    if (issue.path !== undefined) {
      for (const key of issue.path) {
        child = child.at(key);
      }
      issue.path = basePath.concat(issue.path);
    } else {
      issue.path = basePath.slice(0);
    }

    child.setValidationError(validation, issue);
  }
}
