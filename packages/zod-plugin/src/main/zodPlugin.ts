import { ParseParams, ZodErrorMap, ZodIssue, ZodIssueCode, ZodType, ZodTypeAny } from 'zod';
import { Accessor, Field, Plugin, ValidationMixin, validationPlugin } from 'roqueform';

/**
 * The mixin added to fields by the {@linkcode zodPlugin}.
 */
export interface ZodMixin extends ValidationMixin<ZodIssue, Partial<ParseParams>> {
  setError(error: ZodIssue | string): void;
}

/**
 * Enhances fields with validation methods powered by [Zod](https://zod.dev/).
 *
 * @param type The shape that parses the field value.
 * @param errorMap [The Zod error customizer.](https://github.com/colinhacks/zod/blob/master/ERROR_HANDLING.md#customizing-errors-with-zoderrormap)
 * @template T The root field value.
 * @returns The validation plugin.
 */
export function zodPlugin<T>(type: ZodType<any, any, T>, errorMap?: ZodErrorMap): Plugin<ZodMixin, T> {
  let plugin: Plugin<any>;

  return (field, accessor, notify) => {
    plugin ||= createValidationPlugin(type, errorMap, accessor);

    plugin(field, accessor, notify);

    const { setError } = field;

    field.setError = error => {
      setError(typeof error !== 'string' ? error : { code: ZodIssueCode.custom, path: getPath(field), message: error });
    };
  };
}

function createValidationPlugin(type: ZodTypeAny, errorMap: ZodErrorMap | undefined, accessor: Accessor) {
  return validationPlugin<ZodIssue, Partial<ParseParams>>({
    validate(field, setInternalError, options) {
      options = Object.assign({ errorMap }, options);

      const result = type.safeParse(getValue(field, accessor), options);

      if (!result.success) {
        setIssues(field, result.error.issues, setInternalError);
      }
    },

    validateAsync(field, setInternalError, options) {
      options = Object.assign({ errorMap }, options);

      return type.safeParseAsync(getValue(field, accessor), options).then(result => {
        if (!result.success) {
          setIssues(field, result.error.issues, setInternalError);
        }
      });
    },
  });
}

/**
 * Returns the value of the root field that contains a transient value of the target field.
 */
function getValue(field: Field, accessor: Accessor): unknown {
  let value = field.value;

  while (field.parent !== null) {
    value = accessor.set(field.parent.value, field.key, value);
    field = field.parent;
  }
  return value;
}

function getPath(field: Field): Array<string | number> {
  const path: Array<string | number> = [];

  for (let ancestor = field; ancestor.parent !== null; ancestor = ancestor.parent) {
    path.unshift(ancestor.key);
  }
  return path;
}

function setIssues(field: Field, issues: ZodIssue[], setInternalError: (field: Field, error: ZodIssue) => void): void {
  let prefix = getPath(field);

  issues: for (const issue of issues) {
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
    setInternalError(targetField, issue);
  }
}
