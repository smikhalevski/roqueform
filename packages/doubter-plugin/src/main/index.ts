/**
 * Validates Roqueform fields with [Doubter](https://github.com/smikhalevski/doubter#readme) shapes.
 *
 * ```sh
 * npm install --save-prod @roqueform/doubter-plugin
 * ```
 *
 * @module doubter-plugin
 */

import { Err, Ok, ParseOptions, Shape } from 'doubter';
import { Field, FieldPlugin } from 'roqueform';
import validationPlugin, { Validation, ValidationMixin, Validator } from 'roqueform/plugin/validation';

interface PrivateDoubterMixin extends ValidationMixin<ParseOptions | undefined> {
  _valueShape?: Shape;
}

/**
 * Enhances fields with validation methods powered by [Doubter](https://github.com/smikhalevski/doubter#readme).
 *
 * @param shape The shape that parses the field value.
 * @template Value The root field value.
 */
export function doubterPlugin<Value>(
  shape: Shape<Value, any>
): FieldPlugin<Value, ValidationMixin<ParseOptions | void>> {
  return (field: Field<Value, PrivateDoubterMixin>) => {
    field._valueShape = field.parentField === null ? shape : field.parentField._valueShape?.at(field.key) || undefined;

    validationPlugin(validator)(field);
  };
}

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
