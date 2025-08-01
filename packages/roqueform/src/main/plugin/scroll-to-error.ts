/**
 * Enhances Roqueform fields with methods to scroll to the closest invalid field.
 *
 * ```ts
 * import { createField } from 'roqueform';
 * import scrollToErrorPlugin from 'roqueform/plugin/scroll-to-error';
 *
 * const field = createField({ hello: 'world' }, [scrollToErrorPlugin()]);
 *
 * field.at('hello').ref(document.querySelector('input'));
 *
 * field.at('hello').isInvalid = true;
 *
 * field.scrollToError();
 * // ⮕ field.at('hello')
 * ```
 *
 * @module plugin/scroll-to-error
 */
import { Field, FieldPlugin, InferMixin } from '../FieldImpl.js';
import { collectFields } from '../utils.js';

/**
 * The mixin added to fields by the {@link scrollToErrorPlugin}.
 */
export interface ScrollToErrorMixin {
  /**
   * The DOM element associated with the field, or `null` if there's no associated element.
   */
  element: Element | null;

  /**
   * `true` if this field has associated errors.
   */
  isInvalid?: boolean;

  /**
   * Associates the field with the DOM element.
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
  scrollToError(index?: number, alignToTop?: boolean): Field<any, InferMixin<this>> | null;

  /**
   * Scroll to the element that is referenced by an invalid field. Scrolls the field element's ancestor containers such
   * that the field element is visible to the user.
   *
   * The field `ref` should be populated with an `Element` reference.
   *
   * @param index The zero-based index of an invalid field to scroll to. A negative index can be used, indicating an
   * offset from the end of the sequence. `scrollToError(-1)` scroll to the last invalid field. The visual order of
   * fields is used (by default left-to-right and top-to-bottom).
   * @param options The [scroll options](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView#sect1).
   * @returns The field which is scrolled to, or `null` if there's no scroll happening.
   */
  scrollToError(index?: number, options?: ScrollIntoViewOptions): Field<any, InferMixin<this>> | null;
}

/**
 * Enhances the field with methods to scroll to the closest invalid field.
 *
 * Use this plugin in conjunction with another plugin that adds validation methods and manages `error` property of each
 * field.
 */
export default function scrollToErrorPlugin(): FieldPlugin<any, ScrollToErrorMixin> {
  return _scrollToErrorPlugin;
}

const _scrollToErrorPlugin: FieldPlugin<unknown, ScrollToErrorMixin> = field => {
  const { ref } = field;

  field.element = null;

  field.ref = element => {
    field.element = element;

    ref?.(element);
  };

  field.scrollToError = (index = 0, options) => {
    const targets = collectFields(
      field,
      field => field.isInvalid === true && field.element !== null && field.element.isConnected,
      []
    );

    if (targets.length === 0) {
      return null;
    }

    const target = targets.sort(sortByDocumentOrder)[index < 0 ? targets.length + index : index];

    if (target === undefined || target.element === null || target.element === undefined) {
      return null;
    }

    target.element.scrollIntoView(options);
    return target;
  };
};

function sortByDocumentOrder(a: Field<unknown, ScrollToErrorMixin>, b: Field<unknown, ScrollToErrorMixin>): number {
  const aElement = a.element;
  const bElement = b.element;

  if (aElement === null || bElement === null || aElement === bElement) {
    return 0;
  }

  const position = aElement.compareDocumentPosition(bElement);

  if ((position & Node.DOCUMENT_POSITION_FOLLOWING) !== 0 || (position & Node.DOCUMENT_POSITION_CONTAINED_BY) !== 0) {
    return -1;
  }
  if ((position & Node.DOCUMENT_POSITION_PRECEDING) !== 0 || (position & Node.DOCUMENT_POSITION_CONTAINS) !== 0) {
    return 1;
  }
  return 0;
}
