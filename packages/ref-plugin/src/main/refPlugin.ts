import { Field, Plugin } from 'roqueform';

/**
 * The enhancement added to fields by the {@linkcode refPlugin}.
 */
export interface RefPlugin {
  /**
   * The object that holds the reference to the current DOM element.
   */
  readonly ref: { current: Element | null };

  /**
   * The callback that updates {@linkcode ref}.
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

interface EnhancedField extends Field {
  ref?: { current: Element | null };

  refCallback?(element: Element | null): void;
}

/**
 * Enhances fields with DOM-related methods.
 *
 * @template T The field value.
 * @template E The element type stored by ref.
 * @returns The plugin.
 */
export function refPlugin<T>(): Plugin<T, RefPlugin> {
  return (field: EnhancedField) => {
    const ref = field.ref || { current: null };
    const refCallback = field.refCallback;

    Object.assign<Field, RefPlugin>(field, {
      ref,

      refCallback(element) {
        refCallback?.(element);
        ref.current = element;
      },
      scrollIntoView(options) {
        ref.current?.scrollIntoView(options);
      },
      focus(options) {
        if (isHTMLOrSVGElement(ref.current)) {
          ref.current.focus(options);
        }
      },
      blur() {
        if (isHTMLOrSVGElement(ref.current)) {
          ref.current.blur();
        }
      },
    });
  };
}

function isHTMLOrSVGElement(element: Element | null): element is Element & HTMLOrSVGElement {
  return element != null && 'tabIndex' in element && typeof element.tabIndex === 'number';
}
