import { Err, Issue, Ok, ParseOptions, Shape } from 'doubter';
import {
  Field,
  FieldController,
  PluginInjector,
  Validation,
  ValidationErrorsMerger,
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
   */
  valueShape: Shape | null;

  addError(error: Issue | string): void;
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
    (plugin ||= validationPlugin({ validator, errorsMerger }))(field);

    field.valueShape = field.parentField === null ? shape : field.parentField.valueShape?.at(field.key) || null;

    const { addError } = field;

    field.addError = error => {
      addError(
        typeof error === 'string' ? prependPath(field, { code: 'custom', message: error, input: field.value }) : error
      );
    };
  };
}

const validator: Validator<Issue, ParseOptions> = {
  validate(field, options) {
    const { validation, valueShape } = field as unknown as Field<DoubterPlugin>;

    if (validation !== null && valueShape !== null) {
      applyResult(validation, valueShape.try(field.value, Object.assign({ verbose: true }, options)));
    }
  },

  validateAsync(field, options) {
    const { validation, valueShape } = field as unknown as Field<DoubterPlugin>;

    if (validation !== null && valueShape !== null) {
      return valueShape.tryAsync(field.value, Object.assign({ verbose: true }, options)).then(result => {
        applyResult(validation, result);
      });
    }

    return Promise.resolve();
  },
};

const errorsMerger: ValidationErrorsMerger<Issue> = (errors, error) => {
  for (const otherError of errors) {
    if (
      otherError.code !== undefined && error.code !== undefined
        ? otherError.code === error.code
        : otherError.message === error.message
    ) {
      return errors;
    }
  }
  return errors.concat(error);
};

function prependPath(field: FieldController<any>, issue: Issue): Issue {
  while (field.parentField !== null) {
    (issue.path ||= []).unshift(field.key);
    field = field.parentField;
  }
  return issue;
}

function applyResult(validation: Validation<DoubterPlugin>, result: Err | Ok): void {
  if (result.ok) {
    return;
  }

  for (const issue of result.issues) {
    let child = validation.rootField;

    if (issue.path !== undefined) {
      for (const key of issue.path) {
        child = child.at(key);
      }
    }
    if (child.validation === validation) {
      child.addError(prependPath(validation.rootField, issue));
    }
  }
}
