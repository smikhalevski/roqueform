/**
 * Validates Roqueform fields with [Doubter](https://github.com/smikhalevski/doubter#readme) shapes.
 *
 * ```sh
 * npm install --save-prod @roqueform/doubter-plugin
 * ```
 *
 * @module doubter-plugin
 */

import { ParseOptions, Shape } from 'doubter';
import { Field, FieldEvent, FieldPlugin } from 'roqueform';
import validationPlugin, { ValidationMixin } from 'roqueform/plugin/validation';

interface DoubterMixin extends ValidationMixin<ParseOptions> {
  _valueShape?: Shape;
}

/**
 * Enhances fields with validation methods powered by [Doubter](https://github.com/smikhalevski/doubter#readme).
 *
 * @param shape The shape that parses the field value.
 * @template Value The root field value.
 */
export function doubterPlugin<Value>(shape: Shape<Value, any>): FieldPlugin<Value, ValidationMixin<ParseOptions>> {
  return (field: Field<any, DoubterMixin>) => {
    field._valueShape = field.parentField === null ? shape : field.parentField._valueShape?.at(field.key) || undefined;

    validationPlugin<ParseOptions>({
      validate(field, options) {
        field.publish(new FieldEvent('errorCaught', field));
      },
      validateAsync(field, options) {
        return Promise.resolve();
      },
    })(field);
  };
}

// function doubterShapePlugin<Value>(rootShape: Shape<Value, any>): PluginInjector<DoubterShapePlugin, Value> {
//   return field => {
//     field.valueShape = field.parentField === null ? rootShape : field.parentField.valueShape?.at(field.key) || null;
//
//     const { addError } = field;
//
//     field.addError = error => {
//       addError(
//         typeof error === 'string' ? prependPath(field, { code: 'custom', message: error, input: field.value }) : error
//       );
//     };
//   };
// }
//
// const validator: Validator<ParseOptions, Index> = {
//   validate(field, options) {
//     const { validation, valueShape } = field;
//
//     if (validation !== null && valueShape !== null) {
//       applyResult(validation, valueShape.try(field.value, Object.assign({ verbose: true }, options)));
//     }
//   },
//
//   validateAsync(field, options) {
//     const { validation, valueShape } = field;
//
//     if (validation !== null && valueShape !== null) {
//       return valueShape.tryAsync(field.value, Object.assign({ verbose: true }, options)).then(result => {
//         applyResult(validation, result);
//       });
//     }
//
//     return Promise.resolve();
//   },
// };
//
// function concatErrors(errors: readonly Issue[], error: Issue): readonly Issue[] {
//   for (const otherError of errors) {
//     if (
//       otherError.code !== undefined && error.code !== undefined
//         ? otherError.code === error.code
//         : otherError.message === error.message
//     ) {
//       return errors;
//     }
//   }
//   return errors.concat(error);
// }
//
// function prependPath(field: Field, issue: Issue): Issue {
//   for (; field.parentField !== null; field = field.parentField) {
//     (issue.path ||= []).unshift(field.key);
//   }
//   return issue;
// }
//
// function applyResult(validation: Validation<Index>, result: Err | Ok): void {
//   if (result.ok) {
//     return;
//   }
//
//   for (const issue of result.issues) {
//     let child = validation.rootField;
//
//     if (issue.path !== undefined) {
//       for (const key of issue.path) {
//         child = child.at(key);
//       }
//     }
//     if (child.validation === validation) {
//       child.addError(prependPath(validation.rootField, issue));
//     }
//   }
// }
