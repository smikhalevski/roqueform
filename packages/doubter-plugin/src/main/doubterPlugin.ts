import { Err, Issue, Ok, ParseOptions, Shape } from 'doubter';
import { Field, PluginCallback, Validation, ValidationPlugin, validationPlugin, Validator } from 'roqueform';

/**
 * The plugin added to fields by the {@link doubterPlugin}.
 */
export interface DoubterPlugin extends ValidationPlugin<Issue, ParseOptions> {
  /**
   * The shape that Doubter uses to validate {@link FieldController.value the field value}, or `null` if there's no
   * shape for this field.
   */
  ['shape']: Shape;

  setError(error: Issue | string | null | undefined): void;
}

/**
 * Enhances fields with validation methods powered by [Doubter](https://github.com/smikhalevski/doubter#readme).
 *
 * @param shape The shape that parses the field value.
 * @template Value The root field value.
 */
export function doubterPlugin<Value>(shape: Shape<Value, any>): PluginCallback<DoubterPlugin, Value> {
  let plugin;

  return field => {
    (plugin ||= validationPlugin(doubterValidator))(field);

    field.shape = field.parent === null ? shape : field.parent.shape?.at(field.key) || new Shape();

    const { setError } = field;

    field.setError = error => {
      if (error !== null && error !== undefined) {
        if (typeof error === 'string') {
          error = { message: error };
        }
        setPath(field, error);
        error.input = field.value;
      }
      setError(error);
    };
  };
}

const doubterValidator: Validator<Issue, ParseOptions> = {
  validate(field, options) {
    const { validation, shape } = field as unknown as Field<DoubterPlugin>;

    endValidation(validation!, shape.try(field.value, Object.assign({ verbose: true }, options)));
  },

  validateAsync(field, options) {
    const { validation, shape } = field as unknown as Field<DoubterPlugin>;

    return shape.tryAsync(field.value, Object.assign({ verbose: true }, options)).then(result => {
      endValidation(validation!, result);
    });
  },
};

function setPath(field: Field<any>, issue: Issue): void {
  for (let ancestor = field; ancestor.parent !== null; ancestor = ancestor.parent) {
    (issue.path ||= []).unshift(ancestor.key);
  }
}

function endValidation(validation: Validation<DoubterPlugin>, result: Err | Ok): void {
  if (result.ok) {
    return;
  }
  for (const issue of result.issues) {
    let field = validation.root;

    if (issue.path !== undefined) {
      for (const key of issue.path) {
        field = field.at(key);
      }
    }

    setPath(validation.root, issue);
    field.setValidationError(validation, issue);
  }
}
