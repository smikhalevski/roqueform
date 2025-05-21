import { FieldPlugin } from '../Field.js';
import { createObservableRef, Ref } from '../utils.js';

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
  ref: Ref<Element | null>;

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
  return refFieldPlugin;
}

const refFieldPlugin: FieldPlugin<any, RefMixin> = field => {
  const ref = createObservableRef<Element | null>(null);

  field.ref = ref;

  Object.defineProperty(field, 'isFocused', {
    configurable: true,

    get: () => ref.current !== null && ref.current === ref.current.ownerDocument.activeElement,
  });

  field.scrollIntoView = options => {
    ref.current?.scrollIntoView(options);
  };

  field.focus = options => {
    if (isFocusable(ref.current)) {
      ref.current.focus(options);
    }
  };

  field.blur = () => {
    if (isFocusable(ref.current)) {
      ref.current.blur();
    }
  };
};

function isFocusable(element: Element | null): element is HTMLElement | SVGElement {
  return element !== null && 'tabIndex' in element && typeof element.tabIndex === 'number';
}
