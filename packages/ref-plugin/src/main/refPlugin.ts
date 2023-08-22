import { Plugin } from 'roqueform';

/**
 * The mixin added to fields by the {@link refPlugin}.
 */
export interface RefMixin {
  /**
   * The DOM element associated with the field.
   */
  readonly element: Element | null;

  /**
   * The callback that associates the field with the {@link element DOM element}.
   */
  refCallback(element: Element | null): void;

  /**
   * Scrolls the field element's ancestor containers such that the field element is visible to the user.
   *
   * @param alignToTop If `true`, the top of the element will be aligned to the top of the visible area of the
   * scrollable ancestor, otherwise element will be aligned to the bottom of the visible area of the scrollable
   * ancestor.
   */
  scrollIntoView(alignToTop?: boolean): void;

  /**
   * Scrolls the field element's ancestor containers such that the field element is visible to the user.
   *
   * @param options [The scroll options.](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView#sect1)
   */
  scrollIntoView(options?: ScrollIntoViewOptions): void;

  /**
   * Focuses the field element.
   *
   * @param options [The focus options.](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus#options)
   */
  focus(options?: FocusOptions): void;

  /**
   * Blurs the field element.
   */
  blur(): void;
}

/**
 * Enables field-element association and simplifies focus control.
 */
export function refPlugin(): Plugin<RefMixin> {
  return field => {
    const { refCallback } = field;

    let targetElement: Element | null = null;

    Object.defineProperty(field, 'element', { enumerable: true, get: () => targetElement });

    field.refCallback = element => {
      targetElement = element instanceof Element ? element : null;
      refCallback?.(element);
    };

    field.scrollIntoView = options => {
      targetElement?.scrollIntoView(options);
    };

    field.focus = options => {
      if (isFocusable(targetElement)) {
        targetElement.focus(options);
      }
    };

    field.blur = () => {
      if (isFocusable(targetElement)) {
        targetElement.blur();
      }
    };
  };
}

function isFocusable(element: Element | null): element is HTMLElement | SVGElement {
  return element !== null && 'tabIndex' in element && typeof element.tabIndex === 'number';
}
