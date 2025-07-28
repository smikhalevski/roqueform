import { Field, FieldPlugin } from 'roqueform';
import validationPlugin, { Validation, ValidationMixin, Validator } from 'roqueform/plugin/validation';
import { ParseParams } from 'zod';
import { ErrorsConcatenator } from 'roqueform/plugin/errors';
import { StandardSchemaV1 } from '../vendor/standard-schema.js';

/**
 * The mixin added to fields by the {@link schemaPlugin}.
 */
export interface SchemaMixin extends ValidationMixin<Partial<ParseParams> | void> {}

interface PrivateSchemaMixin extends SchemaMixin {
  /**
   * The field validation schema.
   */
  _schema?: StandardSchemaV1;
}

/**
 * Enhances fields with schema validation methods.
 *
 * @param schema The schema that validates the root field value.
 * @template Value The root field value.
 */
export default function schemaPlugin<Value>(schema: StandardSchemaV1<Value, any>): FieldPlugin<Value, SchemaMixin> {
  return (field: Field<Value, PrivateSchemaMixin>) => {
    field._schema = field.parentField === null ? schema : undefined;

    validationPlugin(validator)(field);
  };
}

/**
 * Concatenates unique schema issues.
 */
export const concatSchemaIssues: ErrorsConcatenator<StandardSchemaV1.Issue> = (prevErrors, error) => {
  for (const e of prevErrors) {
    if (e.message === error.message) {
      return prevErrors;
    }
  }
  return prevErrors.concat(error);
};

const validator: Validator<Partial<ParseParams> | undefined, PrivateSchemaMixin> = {
  validate(field, _options) {
    const { validation, _schema } = field;

    if (validation === null || _schema === undefined) {
      // No validation
      return;
    }

    const result = _schema['~standard'].validate(getValue(field));

    if (result instanceof Promise) {
      throw new Error("Sync validation isn't supported");
    }

    applyResult(validation, result);
  },

  validateAsync(field, _options) {
    const { validation, _schema } = field;

    if (validation === null || _schema === undefined) {
      // No validation
      return Promise.resolve();
    }

    return Promise.resolve(_schema['~standard'].validate(getValue(field))).then(result => {
      applyResult(validation, result);
    });
  },
};

function getValue(field: Field<any, PrivateSchemaMixin>): unknown {
  let value = field.value;
  let isTransient = false;

  while (field.parentField !== null) {
    isTransient ||= field.isTransient;
    value = isTransient ? field.valueAccessor.set(field.parentField.value, field.key, value) : field.parentField.value;
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

function applyResult(validation: Validation, result: StandardSchemaV1.Result<unknown>): void {
  if (result.issues === undefined) {
    return;
  }

  const basePath = getPath(validation.rootField);

  issues: for (const issue of result.issues) {
    const { path } = issue;

    let child = validation.rootField;

    if (path !== undefined) {
      if (path.length < basePath.length) {
        continue;
      }

      for (let i = 0; i < basePath.length; ++i) {
        if (path[i] !== basePath[i]) {
          continue issues;
        }
      }

      for (let i = basePath.length; i < path.length; ++i) {
        child = child.at(path[i]);
      }
    }

    if (child.validation !== validation) {
      return;
    }

    child.publish({
      type: 'errorCaught',
      target: child,
      relatedTarget: validation.rootField,
      payload: issue,
    });
  }
}
