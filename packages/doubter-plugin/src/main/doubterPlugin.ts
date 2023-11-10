import { Err, Issue, Ok, ParseOptions, Shape } from 'doubter';
import {
  Field,
  FieldController,
  PluginInjector,
  Validation,
  ValidationPlugin,
  validationPlugin,
  Validator,
} from 'roqueform';

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
      if (error === null || error === undefined) {
        setError(error);
      } else {
        setError(prependPath(field, typeof error === 'string' ? { message: error, input: field.value } : error));
      }
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

function prependPath(field: FieldController<any>, issue: Issue): Issue {
  while (field.parent !== null) {
    (issue.path ||= []).unshift(field.key);
    field = field.parent;
  }
  return issue;
}

function applyResult(validation: Validation<DoubterPlugin>, result: Err | Ok): void {
  if (result.ok) {
    return;
  }

  for (const issue of result.issues) {
    let child = validation.root;

    if (issue.path !== undefined) {
      for (const key of issue.path) {
        child = child.at(key);
      }
    }
    child.setValidationError(validation, prependPath(validation.root, issue));
  }
}
