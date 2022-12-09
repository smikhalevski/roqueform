import { ParseParams, ZodErrorMap, ZodIssue, ZodType } from 'zod';
import { Accessor, Field, Plugin, validationPlugin, ValidationPlugin } from 'roqueform';

/**
 * The enhancement added to fields by the {@linkcode zodPlugin}.
 */
export interface ZodPlugin extends ValidationPlugin<ZodIssue, Partial<ParseParams>> {}

/**
 * Enhances fields with validation methods powered by [Zod](https://zod.dev/).
 *
 * @param type The shape that parses the field value.
 * @param errorMap [The Zod error customizer.](https://github.com/colinhacks/zod/blob/master/ERROR_HANDLING.md#customizing-errors-with-zoderrormap)
 * @template T The value controlled by the enhanced field.
 * @returns The validation plugin.
 */
export function zodPlugin<T>(type: ZodType<any, any, T>, errorMap?: ZodErrorMap): Plugin<T, ZodPlugin> {
  let basePlugin: Plugin<any, ValidationPlugin<ZodIssue, Partial<ParseParams>>> | undefined;

  return (field, accessor) => {
    basePlugin ||= validationPlugin({
      validate(field, setInternalError, options) {
        const result = type.safeParse(getValue(field, accessor), Object.assign({ errorMap }, options));

        if (!result.success) {
          setIssues(field, result.error.issues, setInternalError);
        }
      },

      validateAsync(field, setInternalError, options) {
        return type.safeParseAsync(getValue(field, accessor), Object.assign({ errorMap }, options)).then(result => {
          if (!result.success) {
            setIssues(field, result.error.issues, setInternalError);
          }
        });
      },
    });

    basePlugin(field, accessor);
  };
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

function setIssues(
  targetField: Field,
  issues: ZodIssue[],
  setInternalError: (field: Field, error: ZodIssue) => void
): void {
  let prefix: unknown[] = [];

  for (let field = targetField; field.parent !== null; field = field.parent) {
    prefix.unshift(field.key);
  }

  nextIssue: for (const issue of issues) {
    const { path } = issue;

    let field = targetField;

    if (path.length < prefix.length) {
      continue;
    }
    for (let i = 0; i < prefix.length; ++i) {
      if (path[i] !== prefix[i]) {
        continue nextIssue;
      }
    }
    for (let i = prefix.length; i < path.length; ++i) {
      field = field.at(path[i]);
    }

    setInternalError(field, issue);
  }
}
