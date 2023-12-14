import { Err, Issue, Ok, ParseOptions, Shape } from 'doubter';
import {
  composePlugins,
  errorsPlugin,
  ErrorsPlugin,
  Field,
  FieldController,
  PluginInjector,
  Validation,
  ValidationPlugin,
  validationPlugin,
  Validator,
} from 'roqueform';

interface DoubterErrorsPlugin extends ErrorsPlugin<Issue> {
  /**
   * The shape that Doubter uses to validate {@link FieldController.value the field value}, or `null` if there's no
   * shape for this field.
   */
  valueShape: Shape | null;

  addError(error: Issue | string): void;
}

/**
 * The plugin added to fields by the {@link doubterPlugin}.
 */
export type DoubterPlugin = ValidationPlugin<ParseOptions> & DoubterErrorsPlugin;

/**
 * Enhances fields with validation methods powered by [Doubter](https://github.com/smikhalevski/doubter#readme).
 *
 * @param shape The shape that parses the field value.
 * @template Value The root field value.
 */
export function doubterPlugin<Value>(shape: Shape<Value, any>): PluginInjector<DoubterPlugin, Value> {
  let plugin;

  return field => {
    (plugin ||= composePlugins(validationPlugin(validator), errorsPlugin(concatErrors)))(field);

    field.valueShape = field.parentField === null ? shape : field.parentField.valueShape?.at(field.key) || null;

    const { addError } = field;

    field.addError = error => {
      addError(
        typeof error === 'string' ? prependPath(field, { code: 'custom', message: error, input: field.value }) : error
      );
    };
  };
}

const validator: Validator<ParseOptions> = {
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

function concatErrors(errors: readonly Issue[], error: Issue): readonly Issue[] {
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
}

function prependPath(field: FieldController<any>, issue: Issue): Issue {
  for (; field.parentField !== null; field = field.parentField) {
    (issue.path ||= []).unshift(field.key);
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
