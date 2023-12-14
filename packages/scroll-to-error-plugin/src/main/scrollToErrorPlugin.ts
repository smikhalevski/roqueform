import type { Field, PluginInjector, PluginOf } from 'roqueform';

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
   * `true` if this field has associated errors, or `false` otherwise.
   */
  isInvalid?: boolean;

  /**
   * The DOM element associated with the field, or `null` if there's no associated element.
   */
  element: Element | null;

  /**
   * Associates the field with the {@link element DOM element}.
   */
  ref(element: Element | null): void;

  /**
   * Scroll to the element that is referenced by an invalid field. Scrolls the field element's ancestor containers such
   * that the field element is visible to the user.
   *
   * The field `ref` should be populated with an `Element` reference.
   *
   * @param index The zero-based index of an invalid field to scroll to. A negative index can be used, indicating an
   * offset from the end of the sequence. `scrollToError(-1)` scroll to the last invalid field. The visual order of
   * fields is used (by default left-to-right and top-to-bottom).
   * @param alignToTop If `true`, the top of the element will be aligned to the top of the visible area of the
   * scrollable ancestor, otherwise element will be aligned to the bottom of the visible area of the scrollable
   * ancestor.
   * @returns The field which is scrolled to, or `null` if there's no scroll happening.
   */
  scrollToError(index?: number, alignToTop?: boolean): Field<PluginOf<this>> | null;

  /**
   * Scroll to the element that is referenced by an invalid field. Scrolls the field element's ancestor containers such
   * that the field element is visible to the user.
   *
   * The field `ref` should be populated with an `Element` reference.
   *
   * @param index The zero-based index of an invalid field to scroll to. A negative index can be used, indicating an
   * offset from the end of the sequence. `scrollToError(-1)` scroll to the last invalid field. The visual order of
   * fields is used (by default left-to-right and top-to-bottom).
   * @param options [The scroll options.](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView#sect1)
   * @returns The field which is scrolled to, or `null` if there's no scroll happening.
   */
  scrollToError(index?: number, options?: ScrollToErrorOptions): Field<PluginOf<this>> | null;
}

/**
 * Enhances the field with methods to scroll to a field that has an associated validation error.
 *
 * Use this plugin in conjunction with another plugin that adds validation methods and manages `error` property of each
 * field.
 */
export function scrollToErrorPlugin(): PluginInjector<ScrollToErrorPlugin> {
  return field => {
    const { ref } = field;

    field.element = null;

    field.ref = element => {
      ref?.(element);
      field.element = element instanceof Element ? element : null;
    };

    field.scrollToError = (index = 0, options) => {
      const rtl = options === null || typeof options !== 'object' || options.direction !== 'ltr';
      const targets = getTargetFields(field, []);

      if (targets.length === 0) {
        return null;
      }

      const target = sortByBoundingRect(targets, rtl)[index < 0 ? targets.length + index : index];

      if (target !== undefined) {
        target.element!.scrollIntoView(options);
        return target;
      }
      return null;
    };
  };
}

function getTargetFields(
  field: Field<ScrollToErrorPlugin>,
  batch: Field<ScrollToErrorPlugin>[]
): Field<ScrollToErrorPlugin>[] {
  if (field.isInvalid && field.element !== null && field.element.isConnected) {
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
  if (fields.length === 0) {
    return fields;
  }

  const { body, documentElement } = fields[0].element!.ownerDocument;

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
