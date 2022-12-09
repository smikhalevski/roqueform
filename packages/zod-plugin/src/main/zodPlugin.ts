import { ZodErrorMap, ZodIssue, ZodType } from 'zod';
import { Field, Plugin, validationPlugin, ValidationPlugin } from 'roqueform';

export interface ZodPluginOptions {
  errorMap?: ZodErrorMap;
}

/**
 * The enhancement added to fields by the {@linkcode zodPlugin}.
 */
export interface ZodPlugin extends ValidationPlugin<ZodIssue, ZodPluginOptions> {}

/**
 * Enhances fields with validation methods powered by [Zod](https://zod.dev/).
 *
 * @param type The shape that parses the field value.
 * @template S The shape that parses the field value.
 * @returns The validation plugin.
 */
export function zodPlugin<T>(type: ZodType<any, any, T>): Plugin<T, ZodPlugin> {
  let proxyPlugin: Plugin<any, ValidationPlugin<ZodIssue, ZodPluginOptions>> | undefined;

  return (field, accessor) => {
    proxyPlugin ||= validationPlugin({
      validate(field: Field & ZodPlugin, setInternalError, options) {
        const result = type.safeParse(getValue(field), { errorMap: options?.errorMap });

        if (!result.success) {
          setIssues(field, result.error.issues, setInternalError);
        }
      },

      validateAsync(field: Field & ZodPlugin, setInternalError, options) {
        return type.safeParseAsync(getValue(field), { errorMap: options?.errorMap }).then(result => {
          if (!result.success) {
            setIssues(field, result.error.issues, setInternalError);
          }
        });
      },
    });

    proxyPlugin(field, accessor);
  };
}

function getValue(field: Field): unknown {
  while (field.parent != null) {
    field = field.parent;
  }
  return field.value;
}

function setIssues(
  targetField: Field,
  issues: ZodIssue[],
  setInternalError: (field: Field, error: ZodIssue) => void
): void {
  const pathPrefix: unknown[] = [];

  for (let field = targetField; field.parent != null; field = field.parent) {
    pathPrefix.unshift(field.key);
  }

  nextIssue: for (const issue of issues) {
    const { path } = issue;

    if (path.length < pathPrefix.length) {
      continue;
    }

    for (let i = 0; i < pathPrefix.length; ++i) {
      if (path[i] !== pathPrefix[i]) {
        continue nextIssue;
      }
    }

    let field = targetField;

    for (let i = pathPrefix.length; i < path.length; ++i) {
      field = field.at(path[i]);
    }
    setInternalError(field, issue);
  }
}
