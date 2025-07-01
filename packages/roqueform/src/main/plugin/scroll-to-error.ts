import { Field, FieldPlugin, InferMixin } from '../__FieldImpl.js';
import { createObservableRef, Ref } from '../createObservableRef.js';

/**
 * The mixin added to fields by the {@link scrollToErrorPlugin}.
 */
export interface ScrollToErrorMixin {
  /**
   * `true` if this field has associated errors, or `false` otherwise.
   */
  isInvalid?: boolean;

  /**
   * Associates the field with the {@link element DOM element}.
   */
  ref: Ref<Element | null>;

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
 * Enhances the field with methods to scroll to a field that has an associated validation error.
 *
 * Use this plugin in conjunction with another plugin that adds validation methods and manages `error` property of each
 * field.
 */
export default function scrollToErrorPlugin(): FieldPlugin<any, ScrollToErrorMixin> {
  return field => {
    field.ref = createObservableRef<Element | null>(null);

    field.scrollToError = (index = 0, options) => {
      const targets = getTargetFields(field, []);

      if (targets.length === 0) {
        return null;
      }

      const target = targets.sort(sortByDocumentOrder)[index < 0 ? targets.length + index : index];

      if (target === undefined || target.ref.current === null) {
        return null;
      }

      target.ref.current.scrollIntoView(options);
      return target;
    };
  };
}

function getTargetFields(
  field: Field<unknown, ScrollToErrorMixin>,
  batch: Field<unknown, ScrollToErrorMixin>[]
): Field<unknown, ScrollToErrorMixin>[] {
  if (field.isInvalid && field.ref.current !== null && field.ref.current.isConnected) {
    batch.push(field);
  }

  for (const child of field.children) {
    getTargetFields(child, batch);
  }

  return batch;
}

function sortByDocumentOrder(a: Field<unknown, ScrollToErrorMixin>, b: Field<unknown, ScrollToErrorMixin>): number {
  const aElement = a.ref.current;
  const bElement = b.ref.current;

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
