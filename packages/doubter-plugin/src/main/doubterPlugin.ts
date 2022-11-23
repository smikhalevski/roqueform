import { AnyShape, Issue, ParseOptions, Shape } from 'doubter';
import { Field, Plugin, validationPlugin, ValidationPlugin } from 'roqueform';

const anyShape = new Shape();

/**
 * The enhancement added to fields by the {@linkcode doubterPlugin}.
 */
export interface DoubterPlugin extends ValidationPlugin<Partial<Issue>, ParseOptions> {
  /**
   * The shape that validates the value of the field.
   */
  readonly shape: AnyShape;
}

/**
 * Enhances fields with validation methods powered by [Doubter](https://github.com/smikhalevski/doubter#readme).
 *
 * @param shape The shape that parses the field value.
 * @template S The shape that parses the field value.
 * @returns The validation plugin.
 */
export function doubterPlugin<T>(shape: Shape<T, any>): Plugin<T, DoubterPlugin> {
  let proxyPlugin: Plugin<any, ValidationPlugin<Partial<Issue>, ParseOptions>> | undefined;

  return (field, accessor) => {
    proxyPlugin ||= validationPlugin({
      validate(field: Field & DoubterPlugin, setInternalError, options) {
        const result = field.shape.try(field.value, Object.assign({ verbose: true }, options));

        if (!result.ok) {
          setIssues(field, result.issues, setInternalError);
        }
      },

      validateAsync(field: Field & DoubterPlugin, setInternalError, options) {
        return field.shape.tryAsync(field.value, Object.assign({ verbose: true }, options)).then(result => {
          if (!result.ok) {
            setIssues(field, result.issues, setInternalError);
          }
        });
      },
    });

    Object.assign(proxyPlugin(field, accessor) || field, {
      shape: field.parent === null ? shape : (field.parent as Field & DoubterPlugin).shape.at(field.key) || anyShape
    });
  };
}

function setIssues(targetField: Field, issues: Issue[], setInternalError: (field: Field, error: Issue) => void): void {
  issues: for (const issue of issues) {
    const { path } = issue;

    let field = targetField;

    for (let i = 0; i < path.length; ++i) {
      field = field.at(path[i]);

      if (field.transient) {
        // Nested transient fields don't receive errors
        continue issues;
      }
    }
    for (let field = targetField; field.parent !== null; field = field.parent) {
      path.unshift(field.key);
    }
    setInternalError(field, issue);
  }
}
