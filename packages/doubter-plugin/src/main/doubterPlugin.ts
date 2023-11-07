import { Issue, ParseOptions, Shape } from 'doubter';
import { Field, PluginCallback, ValidationPlugin, validationPlugin } from 'roqueform';

/**
 * The plugin added to fields by the {@link doubterPlugin}.
 */
export interface DoubterPlugin extends ValidationPlugin<Issue, ParseOptions> {
  /**
   * @internal
   */
  value: unknown;

  /**
   * The shape that Doubter uses to validate {@link FieldController.value the field value}.
   */
  ['shape']: Shape<this['value'], any> | null;

  setError(error: Issue | string | null | undefined): void;
}

/**
 * Enhances fields with validation methods powered by [Doubter](https://github.com/smikhalevski/doubter#readme).
 *
 * @param shape The shape that parses the field value.
 * @template Value The root field value.
 */
export function doubterPlugin<Value>(shape: Shape<Value, any>): PluginCallback<DoubterPlugin, Value> {
  let plugin;

  return field => {
    plugin ||= validationPlugin<Issue, ParseOptions>({
      validate(field, options) {
        const shape = (field as unknown as DoubterPlugin).shape;
        if (shape === null) {
          return;
        }
        const result = shape.try(field.value, Object.assign({ verbose: true }, options));
        if (!result.ok) {
          setIssues(field, result.issues);
        }
      },

      validateAsync(field, signal, options) {
        const shape = (field as unknown as DoubterPlugin).shape;
        if (shape === null) {
          return Promise.resolve();
        }
        return shape.tryAsync(field.value, Object.assign({ verbose: true }, options)).then(result => {
          if (!result.ok && !signal.aborted) {
            setIssues(field, result.issues);
          }
        });
      },
    });

    plugin(field);

    field.shape = field.parent !== null ? field.parent.shape?.at(field.key) || null : shape;

    const { setError } = field;

    field.setError = error => {
      if (error === null || error === undefined) {
        return setError(error);
      }
      if (typeof error === 'string') {
        error = { message: error };
      }
      error.path = prependPath(field, error.path);
      error.input = field.value;

      setError(error);
    };
  };
}

function prependPath(field: Field<any>, path: unknown[] | undefined): unknown[] | undefined {
  for (let ancestor = field; ancestor.parent !== null; ancestor = ancestor.parent) {
    (path ||= []).unshift(ancestor.key);
  }
  return path;
}

function setIssues(validationRoot: Field<ValidationPlugin>, issues: Issue[]): void {
  for (const issue of issues) {
    let targetField = validationRoot;

    if (Array.isArray(issue.path)) {
      for (const key of issue.path) {
        targetField = targetField.at(key);
      }
    }

    issue.path = prependPath(validationRoot, issue.path);
    targetField.setValidationError(issue);
  }
}
