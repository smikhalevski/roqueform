import {
  composePlugins,
  errorsPlugin,
  ErrorsPlugin,
  Field,
  FieldPlugin,
  Validation,
  validationPlugin,
  ValidationPlugin,
  Validator,
} from 'roqueform';
import { ParseParams, SafeParseReturnType, ZodIssue, ZodIssueCode, ZodType, ZodTypeAny } from 'zod';

export interface ZodTypePlugin {
  /**
   * The Zod validation type of the root value.
   */
  valueType: ZodTypeAny;

  /**
   * Associates an error with the field.
   *
   * If a string is provided it becomes an error message. The error code in this case is set to "custom".
   *
   * @param error The error to add.
   */
  addError(error: ZodIssue | string): void;
}

/**
 * The plugin added to fields by the {@link zodPlugin}.
 */
export type ZodPlugin = ValidationPlugin<Partial<ParseParams>> & ErrorsPlugin<ZodIssue> & ZodTypePlugin;

/**
 * Enhances fields with validation methods powered by [Zod](https://zod.dev/).
 *
 * @param type The type that validates the field value.
 * @template Value The root field value.
 * @returns The validation plugin.
 */
export function zodPlugin<Value>(type: ZodType<any, any, Value>): FieldPlugin<ZodPlugin, Value> {
  return validationPlugin(composePlugins(errorsPlugin(concatErrors), zodTypePlugin(type)), validator);
}

function zodTypePlugin<Value>(rootType: ZodType<any, any, Value>): FieldPlugin<ZodTypePlugin, Value> {
  return field => {
    field.valueType = field.parentField?.valueType || rootType;

    const { addError } = field;

    field.addError = error => {
      addError(typeof error === 'string' ? { code: ZodIssueCode.custom, path: getPath(field), message: error } : error);
    };
  };
}

const validator: Validator<Partial<ParseParams>, ZodPlugin> = {
  validate(field, options) {
    const { validation, valueType } = field;

    if (validation !== null) {
      applyResult(validation, valueType.safeParse(getValue(field), options));
    }
  },

  validateAsync(field, options) {
    const { validation, valueType } = field;

    if (validation !== null) {
      return valueType.safeParseAsync(getValue(field), options).then(result => {
        applyResult(validation, result);
      });
    }

    return Promise.resolve();
  },
};

function concatErrors(errors: readonly ZodIssue[], error: ZodIssue): readonly ZodIssue[] {
  for (const otherError of errors) {
    if (otherError.code === error.code) {
      return errors;
    }
  }
  return errors.concat(error);
}

function getValue(field: Field<ZodPlugin>): unknown {
  let value = field.value;
  let transient = false;

  while (field.parentField !== null) {
    transient ||= field.isTransient;
    value = transient ? field.valueAccessor.set(field.parentField.value, field.key, value) : field.parentField.value;
    field = field.parentField;
  }
  return value;
}

function getPath(field: Field): any[] {
  const path = [];

  while (field.parentField !== null) {
    path.unshift(field.key);
    field = field.parentField;
  }
  return path;
}

function applyResult(validation: Validation<ZodPlugin>, result: SafeParseReturnType<unknown, unknown>): void {
  if (result.success) {
    return;
  }

  const basePath = getPath(validation.rootField);

  issues: for (const issue of result.error.issues) {
    const { path } = issue;

    if (path.length < basePath.length) {
      continue;
    }
    for (let i = 0; i < basePath.length; ++i) {
      if (path[i] !== basePath[i]) {
        continue issues;
      }
    }

    let child = validation.rootField;
    for (let i = basePath.length; i < path.length; ++i) {
      child = child.at(path[i]);
    }
    if (child.validation === validation) {
      child.addError(issue);
    }
  }
}
