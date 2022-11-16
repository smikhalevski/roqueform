import type { MutableRefObject, RefCallback, RefObject } from 'react';
import type { Field, Plugin } from 'roqueform';

/**
 * The enhancement added to fields by the {@linkcode refPlugin}.
 */
export interface RefPlugin<E extends HTMLElement> {
  /**
   * The ref object that should be passed to the `ref` property of a DOM element.
   */
  readonly ref: RefObject<E>;

  /**
   * The callback that updates {@linkcode ref}.
   */
  readonly refCallback: RefCallback<E | null>;

  /**
   * `true` if the field element has focus, or `false` otherwise.
   */
  readonly active: boolean;

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

    Object.defineProperty(field, 'active', {
      get: () => typeof document !== 'undefined' && ref.current !== null && document.activeElement === ref.current,
    });

    Object.assign<Field, Omit<RefPlugin<E>, 'active'>>(field, {
      ref,

      refCallback(element) {
        ref.current = element;
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
