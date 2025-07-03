/**
 * Validates Roqueform fields with [Doubter](https://github.com/smikhalevski/doubter#readme) shapes.
 *
 * ```sh
 * npm install --save-prod @roqueform/doubter-plugin
 * ```
 *
 * ```ts
 * import * as d from 'doubter';
 * import { createField } from 'roqueform';
 * import errorsPlugin from 'roqueform/plugin/errors';
 * import doubterPlugin, { concatIssues } from '@roqueform/doubter';
 *
 * const fieldShape = d.object({
 *   hello: d.string()
 * });
 *
 * const field = createField({ hello: 'world' }, [
 *   errorsPlugin(concatIssues),
 *   doubterPlugin(fieldShape)
 * ]);
 *
 * field.at('hello');
 * // ⮕ Field<string>
 * ```
 *
 * @module @roqueform/doubter-plugin
 */

import { Err, Issue, Ok, ParseOptions, Shape } from 'doubter';
import { Field, FieldPlugin } from 'roqueform';
import validationPlugin, { Validation, ValidationMixin, Validator } from 'roqueform/plugin/validation';
import { ErrorsConcatenator } from 'roqueform/plugin/errors';

/**
 * The mixin added to fields by the {@link doubterPlugin}.
 */
export interface DoubterMixin extends ValidationMixin<ParseOptions | void> {}

interface PrivateDoubterMixin extends DoubterMixin {
  _valueShape?: Shape;
}

/**
 * Validates field with a [Doubter](https://github.com/smikhalevski/doubter#readme) shape.
 *
 * @param shape The shape that parses the field value.
 * @template Value The root field value.
 */
export default function doubterPlugin<Value>(shape: Shape<Value, any>): FieldPlugin<Value, DoubterMixin> {
  return (field: Field<Value, PrivateDoubterMixin>) => {
    field._valueShape = field.parentField === null ? shape : field.parentField._valueShape?.at(field.key) || undefined;

    validationPlugin(validator)(field);
  };
}

export const concatIssues: ErrorsConcatenator<Issue> = (prevErrors, error) => {
  for (const e of prevErrors) {
    if (e.code !== undefined && error.code !== undefined ? e.code === error.code : e.message === error.message) {
      return prevErrors;
    }
  }
  return prevErrors.concat(error);
};

const validator: Validator<ParseOptions | undefined, PrivateDoubterMixin> = {
  validate(field, options) {
    const { validation, _valueShape } = field;

    if (validation === null || _valueShape === undefined) {
      // No validation
      return;
    }

    applyResult(validation, _valueShape.try(field.value, options));
  },

  validateAsync(field, options) {
    const { validation, _valueShape } = field;

    if (validation === null || _valueShape === undefined) {
      // No validation
      return Promise.resolve();
    }

    return _valueShape.tryAsync(field.value, options).then(result => {
      applyResult(validation, result);
    });
  },
};

function applyResult(validation: Validation, result: Err | Ok): void {
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

    if (child.validation !== validation) {
      continue;
    }

    for (let field = validation.rootField; field.parentField !== null; field = field.parentField) {
      (issue.path ||= []).unshift(field.key);
    }

    child.publish({
      type: 'errorCaught',
      target: child,
      relatedTarget: validation.rootField,
      payload: issue,
    });
  }
}
