/**
 * Validates Roqueform fields with [Zod](https://zod.dev/) schemas.
 *
 * ```sh
 * npm install --save-prod @roqueform/zod-plugin
 * ```
 *
 * @module @roqueform/zod-plugin
 */

import { Field, FieldPlugin } from 'roqueform';
import validationPlugin, { Validation, ValidationMixin, Validator } from 'roqueform/plugin/validation';
import { ParseParams, SafeParseReturnType, ZodType, ZodTypeAny } from 'zod';

// Enable errorCaught event
// noinspection ES6UnusedImports
import { type ErrorsMixin as _ } from 'roqueform/plugin/errors';

/**
 * The mixin added to fields by the {@link zodPlugin}.
 */
export interface ZodMixin extends ValidationMixin<Partial<ParseParams> | void> {}

interface PrivateZodMixin extends ZodMixin {
  /**
   * The Zod validation type of the root value.
   */
  _valueType?: ZodTypeAny;
}

/**
 * Enhances fields with validation methods powered by [Zod](https://zod.dev/).
 *
 * @param type The type that validates the field value.
 * @template Value The root field value.
 */
export default function zodPlugin<Value>(type: ZodType<any, any, Value>): FieldPlugin<Value, ZodMixin> {
  return (field: Field<Value, PrivateZodMixin>) => {
    field._valueType = field.parentField?._valueType || type;

    validationPlugin(validator)(field);
  };
}

const validator: Validator<Partial<ParseParams> | undefined, PrivateZodMixin> = {
  validate(field, options) {
    const { validation, _valueType } = field;

    if (validation === null || _valueType === undefined) {
      // No validation
      return;
    }

    applyResult(validation, _valueType.safeParse(getValue(field), options));
  },

  validateAsync(field, options) {
    const { validation, _valueType } = field;

    if (validation === null || _valueType === undefined) {
      // No validation
      return Promise.resolve();
    }

    return _valueType.safeParseAsync(getValue(field), options).then(result => {
      applyResult(validation, result);
    });
  },
};

function getValue(field: Field<any, PrivateZodMixin>): unknown {
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

function applyResult(validation: Validation, result: SafeParseReturnType<unknown, unknown>): void {
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
