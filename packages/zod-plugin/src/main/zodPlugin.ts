import { ParseParams, SafeParseReturnType, ZodIssue, ZodIssueCode, ZodSchema, ZodTypeAny } from 'zod';
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
 * The plugin added to fields by the {@link zodPlugin}.
 */
export interface ZodPlugin extends ValidationPlugin<ZodIssue, Partial<ParseParams>> {
  /**
   * The Zod validation schema of the root value.
   */
  valueSchema: ZodTypeAny;

  setError(error: ZodIssue | string | null | undefined): void;
}

/**
 * Enhances fields with validation methods powered by [Zod](https://zod.dev/).
 *
 * @param schema The schema that validates the field value.
 * @template Value The root field value.
 * @returns The validation plugin.
 */
export function zodPlugin<Value>(schema: ZodSchema<any, any, Value>): PluginInjector<ZodPlugin, Value> {
  let plugin;

  return field => {
    (plugin ||= validationPlugin(zodValidator))(field);

    field.valueSchema = field.parentField?.valueSchema || schema;

    const { setError } = field;

    field.setError = error => {
      setError(typeof error === 'string' ? { code: ZodIssueCode.custom, path: getPath(field), message: error } : error);
    };
  };
}

const zodValidator: Validator<ZodIssue, Partial<ParseParams>> = {
  validate(field, options) {
    const { validation, valueSchema } = field as unknown as Field<ZodPlugin>;

    if (validation !== null) {
      applyResult(validation, valueSchema.safeParse(getValue(field), options));
    }
  },

  validateAsync(field, options) {
    const { validation, valueSchema } = field as unknown as Field<ZodPlugin>;

    if (validation !== null) {
      return valueSchema.safeParseAsync(getValue(field), options).then(result => {
        applyResult(validation, result);
      });
    }

    return Promise.resolve();
  },
};

function getValue(field: Field<ValidationPlugin>): unknown {
  let value = field.value;
  let transient = false;

  while (field.parentField !== null) {
    transient ||= field.isTransient;
    value = transient ? field.valueAccessor.set(field.parentField.value, field.key, value) : field.parentField.value;
    field = field.parentField;
  }
  return value;
}

function getPath(field: FieldController<any>): any[] {
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

  const basePath = getPath(validation.root);

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

    let child = validation.root;
    for (let i = basePath.length; i < path.length; ++i) {
      child = child.at(path[i]);
    }
    child.setValidationError(validation, issue);
  }
}
