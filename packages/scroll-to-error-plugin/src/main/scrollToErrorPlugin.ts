import { Field, PluginCallback } from 'roqueform';

export interface ScrollToErrorOptions extends ScrollIntoViewOptions {
  /**
   * The sorting order for elements.
   */
  direction?: 'rtl' | 'ltr';
}

/**
 * The plugin added to fields by the {@link scrollToErrorPlugin}.
 */
export interface ScrollToErrorPlugin {
  /**
   * @internal
   */
  error: unknown;

  /**
   * The DOM element associated with the field.
   */
  element: Element | null;

  /**
   * Associates the field with the DOM element.
   */
  refCallback(element: Element | null): void;

  /**
   * Scroll to the element that is referenced by a field that has an associated error. Scrolls the field element's
   * ancestor containers such that the field element is visible to the user.
   *
   * The field `ref` should be populated with an `Element` reference.
   *
   * @param index The zero-based index of an error to scroll to. A negative index can be used, indicating an offset from
   * the end of the sequence. `scrollToError(-1)` scroll to the last error. The order of errors is the same as the
   * visual order of fields left-to-right and top-to-bottom.
   * @param alignToTop If `true`, the top of the element will be aligned to the top of the visible area of the
   * scrollable ancestor, otherwise element will be aligned to the bottom of the visible area of the scrollable
   * ancestor.
   * @returns `true` if there's an error to scroll to, or `false` otherwise.
   */
  scrollToError(index?: number, alignToTop?: boolean): boolean;

  /**
   * Scroll to the element that is referenced by a field that has an associated error. Scrolls the field element's
   * ancestor containers such that the field element is visible to the user.
   *
   * The field `ref` should be populated with an `Element` reference.
   *
   * @param index The zero-based index of an error to scroll to. A negative index can be used, indicating an offset from
   * the end of the sequence. `scrollToError(-1)` scroll to the last error. The order of errors is the same as the
   * visual order of fields left-to-right and top-to-bottom.
   * @param options [The scroll options.](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView#sect1)
   * @returns `true` if there's an error to scroll to, or `false` otherwise.
   */
  scrollToError(index?: number, options?: ScrollToErrorOptions): boolean;
}

/**
 * Enhances the field with methods to scroll to a field that has an associated validation error.
 *
 * Use this plugin in conjunction with another plugin that adds validation methods and manages `error` property of each
 * field.
 */
export function scrollToErrorPlugin(): PluginCallback<ScrollToErrorPlugin> {
  return field => {
    const { refCallback } = field;

    field.refCallback = element => {
      field.element = element;
      refCallback?.(element);
    };

    field.scrollToError = (index = 0, options) => {
      const rtl = options === null || typeof options !== 'object' || options.direction !== 'ltr';
      const targets = getTargetFields(field, []);

      if (targets.length === 0) {
        return false;
      }

      const target = sortByBoundingRect(targets, rtl)[index < 0 ? targets.length + index : index];

      if (target !== undefined) {
        target.element!.scrollIntoView(options);
      }
      return true;
    };
  };
}

function getTargetFields(
  field: Field<ScrollToErrorPlugin>,
  batch: Field<ScrollToErrorPlugin>[]
): Field<ScrollToErrorPlugin>[] {
  if (field.error !== null && field.element !== null) {
    const rect = field.element.getBoundingClientRect();

    if (rect.top !== 0 || rect.left !== 0 || rect.width !== 0 || rect.height !== 0) {
      batch.push(field);
    }
  }
  if (field.children !== null) {
    for (const child of field.children) {
      getTargetFields(child, batch);
    }
  }
  return batch;
}

function sortByBoundingRect(fields: Field<ScrollToErrorPlugin>[], rtl: boolean): Field<ScrollToErrorPlugin>[] {
  const { body, documentElement } = document;

  const scrollY = window.pageYOffset || documentElement.scrollTop || body.scrollTop;
  const clientY = documentElement.clientTop || body.clientTop || 0;

  const scrollX = window.pageXOffset || documentElement.scrollLeft || body.scrollLeft;
  const clientX = documentElement.clientLeft || body.clientLeft || 0;

  return fields.sort((field1, field2) => {
    const rect1 = field1.element!.getBoundingClientRect();
    const rect2 = field2.element!.getBoundingClientRect();

    const y1 = Math.round(rect1.top + scrollY - clientY);
    const y2 = Math.round(rect2.top + scrollY - clientY);

    const x1 = Math.round(rect1.left + scrollX - clientX);
    const x2 = Math.round(rect2.left + scrollX - clientX);

    return y1 - y2 || (rtl ? x1 - x2 : x2 - x1);
  });
}
