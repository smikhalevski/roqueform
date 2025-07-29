/**
 * Enhances Roqueform fields with validation methods that use
 * [Standard Schema](https://github.com/standard-schema/standard-schema#readme) instances to detect issues.
 *
 * ```ts
 * import * as d from 'doubter';
 * import { createField } from 'roqueform';
 * import errorsPlugin from 'roqueform/plugin/errors';
 * import schemaPlugin from 'roqueform/plugin/schema';
 *
 * const helloSchema = d.object({
 *   hello: d.string(),
 * });
 *
 * const field = createField({ hello: 'world' }, [
 *   errorsPlugin<d.Issue>(),
 *   schemaPlugin(helloSchema),
 * ]);
 *
 * field.at('hello').validate();
 * ```
 *
 * @module plugin/schema
 */

import validationPlugin, { Validation, ValidationMixin, Validator } from './validation.js';
import { StandardSchemaV1 } from '../vendor/standard-schema.js';
import { isPromiseLike, noop } from '../utils.js';
import { Field, FieldPlugin } from '../FieldImpl.js';

/**
 * Enhances the field with validation methods that use
 * [Standard Schema](https://github.com/standard-schema/standard-schema#readme) instance to detect issues.
 *
 * @param schema The schema that validates the root field value.
 * @template Schema The schema that validates the root field value.
 */
export default function schemaPlugin<Schema extends StandardSchemaV1>(
  schema: Schema
): FieldPlugin<
  StandardSchemaV1.InferInput<Schema>,
  ValidationMixin<
    | StandardSchemaV1.Result<StandardSchemaV1.InferOutput<Schema>>
    | Promise<StandardSchemaV1.Result<StandardSchemaV1.InferOutput<Schema>>>,
    StandardSchemaV1.InferOptions<Schema>
  >
> {
  return field => validationPlugin(createSchemaValidator(schema))(field);
}

/**
 * Creates a validator that uses
 * a [Standard Schema](https://github.com/standard-schema/standard-schema#readme) instance to detect issues.
 *
 * @param schema The schema that validates the root field value.
 * @template Schema The schema that validates the root field value.
 */
export function createSchemaValidator<Schema extends StandardSchemaV1>(
  schema: Schema
): Validator<
  | StandardSchemaV1.Result<StandardSchemaV1.InferOutput<Schema>>
  | Promise<StandardSchemaV1.Result<StandardSchemaV1.InferOutput<Schema>>>,
  StandardSchemaV1.InferOptions<Schema>
> {
  return (validation, options) => {
    const result = schema['~standard'].validate(getRootValue(validation.field), options);

    if (isPromiseLike(result)) {
      // Prevent unhandled rejection
      result.then(result => publishIssues(validation, result), noop);
    } else {
      publishIssues(validation, result);
    }

    return result;
  };
}

function publishIssues(validation: Validation<unknown>, result: StandardSchemaV1.Result<unknown>): void {
  if (result.issues === undefined) {
    // No issues to publish
    return;
  }

  nextIssue: for (const issue of result.issues) {
    let child = validation.field;

    const fieldPath = child.path;
    const issuePath = issue.path;

    if (issuePath !== undefined ? issuePath.length < fieldPath.length : fieldPath.length !== 0) {
      // Insufficient issue path length
      continue;
    }

    if (issuePath !== undefined) {
      // Ensure issue path starts with the validated field path
      for (let i = 0; i < fieldPath.length; ++i) {
        if (issuePath[i] !== fieldPath[i]) {
          continue nextIssue;
        }
      }

      // Get a field at the issue path
      for (let i = fieldPath.length; i < issuePath.length; ++i) {
        child = child.at(issuePath[i]);
      }
    }

    if (child.validation !== validation) {
      // Validation was aborted
      continue;
    }

    child.publish({ type: 'errorDetected', target: child, relatedTarget: validation.field, payload: issue });
  }
}

/**
 * Returns the root field value that incorporates the current value (potentially transient) of the provided field.
 */
function getRootValue(field: Field): unknown {
  let value = field.value;

  for (let isTransient = false; field.parentField !== null; field = field.parentField) {
    isTransient ||= field.isTransient;

    if (isTransient) {
      value = field.parentField.valueAccessor.set(field.parentField.value, field.key, value);
    } else {
      value = field.parentField.value;
    }
  }

  return value;
}
