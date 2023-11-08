import { ParseParams, SafeParseReturnType, ZodIssue, ZodIssueCode, ZodType, ZodTypeAny } from 'zod';
import { Field, PluginCallback, ValidationPlugin, validationPlugin, Validator } from 'roqueform';

/**
 * The plugin added to fields by the {@link zodPlugin}.
 */
export interface ZodPlugin extends ValidationPlugin<ZodIssue, Partial<ParseParams>> {
  /**
   * The Zod validation schema of the root value.
   */
  ['schema']: ZodTypeAny;

  setError(error: ZodIssue | string | null | undefined): void;
}

/**
 * Enhances fields with validation methods powered by [Zod](https://zod.dev/).
 *
 * @param schema The shape that parses the field value.
 * @template Value The root field value.
 * @returns The validation plugin.
 */
export function zodPlugin<Value>(schema: ZodType<any, any, Value>): PluginCallback<ZodPlugin, Value> {
  let plugin: PluginCallback<any>;

  return field => {
    (plugin ||= validationPlugin(zodValidator))(field);

    field.schema = schema;

    const { setError } = field;

    field.setError = error => {
      if (typeof error === 'string') {
        error = { code: ZodIssueCode.custom, path: getPath(field), message: error };
      }
      setError(error);
    };
  };
}

const zodValidator: Validator<ZodIssue, Partial<ParseParams>> = {
  validate(field, options) {
    applyResult(field, (field as unknown as Field<ZodPlugin>).schema.safeParse(getRootValue(field), options));
  },

  validateAsync(field, options) {
    return (field as unknown as Field<ZodPlugin>).schema.safeParseAsync(getRootValue(field), options).then(result => {
      applyResult(field, result);
    });
  },
};

function getRootValue(field: Field<ValidationPlugin>): unknown {
  let value = field.value;
  let transient = false;

  while (field.parent !== null) {
    transient ||= field.isTransient;
    value = transient ? field.accessor.set(field.parent.value, field.key, value) : field.parent.value;
    field = field.parent;
  }
  return value;
}

function getPath(field: Field<any>): any[] {
  const path = [];
  for (let ancestor = field; ancestor.parent !== null; ancestor = ancestor.parent) {
    path.unshift(ancestor.key);
  }
  return path;
}

function applyResult(field: Field<ValidationPlugin>, result: SafeParseReturnType<any, any>): void {
  const { validation } = field;

  if (validation === null || result.success) {
    return;
  }

  let prefix = getPath(field);

  issues: for (const issue of result.error.issues) {
    const { path } = issue;

    let targetField = field;

    if (path.length < prefix.length) {
      continue;
    }
    for (let i = 0; i < prefix.length; ++i) {
      if (path[i] !== prefix[i]) {
        continue issues;
      }
    }
    for (let i = prefix.length; i < path.length; ++i) {
      targetField = targetField.at(path[i]);
    }
    field.setValidationError(validation, issue);
  }
}
