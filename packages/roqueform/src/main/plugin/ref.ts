import { FieldPlugin } from '../FieldImpl.js';

/**
 * The plugin added to fields by the {@link refPlugin}.
 */
export interface RefMixin {
  /**
   * `true` if {@link element the DOM element} is focused, or `false` otherwise.
   */
  readonly isFocused: boolean;

  /**
   * Associates the field with the {@link element DOM element}.
   */
  ref: (element: Element | null) => void;

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
   * @param options The [scroll options](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView#sect1).
   */
  scrollIntoView(options?: ScrollIntoViewOptions): void;

  /**
   * Focuses the field element.
   *
   * @param options The [scroll options](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView#sect1).
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
export default function refPlugin(): FieldPlugin<any, RefMixin> {
  return _refPlugin;
}

const _refPlugin: FieldPlugin<any, RefMixin> = field => {
  const { ref } = field;

  let element: Element | null = null;

  Object.defineProperty(field, 'isFocused', {
    configurable: true,

    get: () => element !== null && element !== undefined && element === element.ownerDocument.activeElement,
  });

  field.ref = nextElement => {
    element = nextElement;

    ref?.(element);
  };

  field.scrollIntoView = options => {
    element?.scrollIntoView(options);
  };

  field.focus = options => {
    if (isFocusable(element)) {
      element.focus(options);
    }
  };

  field.blur = () => {
    if (isFocusable(element)) {
      element.blur();
    }
  };
};

function isFocusable(element: Element | null): element is HTMLElement | SVGElement {
  return element !== null && 'tabIndex' in element && typeof element.tabIndex === 'number';
}
