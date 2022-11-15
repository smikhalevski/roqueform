import { MutableRefObject, RefCallback, RefObject } from 'react';
import { Field, Plugin } from 'roqueform';

/**
 * The mixin added to fields by {@linkcode refPlugin}.
 */
export interface RefPlugin<E extends HTMLElement> {
  /**
   * The ref object that should be passed to the `ref` property of a DOM element.
   */
  ref: RefObject<E>;

  /**
   * The callback that updates {@linkcode ref}.
   */
  refCallback: RefCallback<E | null>;

  /**
   * Returns `true` is the field element has focus, or `false` otherwise.
   */
  isActive(): boolean;

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
 * Adds DOM-related methods to a field.
 *
 * @template T The root field value.
 * @template E The element type stored by ref.
 * @returns The plugin.
 */
export function refPlugin<T, E extends HTMLElement = HTMLElement>(): Plugin<T, RefPlugin<E>> {
  return field => {
    const ref: MutableRefObject<E | null> = { current: null };

    Object.assign<Field, RefPlugin<E>>(field, {
      ref,

      refCallback(element) {
        ref.current = element;
      },
      isActive() {
        return document.activeElement === ref.current;
      },
      scrollIntoView(options) {
        ref.current?.scrollIntoView(options);
      },
      focus(options) {
        ref.current?.focus(options);
      },
      blur() {
        ref.current?.blur();
      },
    });
  };
}
