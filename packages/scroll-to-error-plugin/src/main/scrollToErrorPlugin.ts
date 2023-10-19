import { Field, Plugin } from 'roqueform';

export interface ScrollToErrorOptions extends ScrollIntoViewOptions {
  /**
   * The sorting order for elements.
   */
  direction?: 'rtl' | 'ltr';
}

/**
 * The mixin added to fields by the {@link scrollToErrorPlugin}.
 */
export interface ScrollToErrorMixin {
  /**
   * @internal
   */
  readonly error: unknown;

  /**
   * The callback that associates the field with the DOM element.
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
export function scrollToErrorPlugin(): Plugin<ScrollToErrorMixin> {
  let controllerMap: WeakMap<Field, FieldController>;

  return field => {
    controllerMap ||= new WeakMap();

    if (controllerMap.has(field)) {
      return;
    }

    const controller: FieldController = {
      _parent: field.parent !== null ? controllerMap.get(field.parent)! : null,
      _targetControllers: [],
      _field: field,
      _element: null,
    };

    controllerMap.set(field, controller);

    for (let ancestor: FieldController | null = controller; ancestor !== null; ancestor = ancestor._parent) {
      ancestor._targetControllers!.push(controller);
    }

    const { refCallback } = field;

    field.refCallback = element => {
      controller._element = element;
      refCallback?.(element);
    };

    field.scrollToError = (index = 0, options) => {
      const rtl = options === null || typeof options !== 'object' || options.direction !== 'ltr';
      const controllers = controller._targetControllers.filter(hasVisibleError);
      const targetController = sortByBoundingRect(controllers, rtl)[index < 0 ? controllers.length + index : index];

      if (targetController === undefined) {
        return false;
      }
      targetController._element!.scrollIntoView(options);
      return true;
    };
  };
}

interface FieldController {
  _parent: FieldController | null;

  /**
   * The array of controllers that can be scrolled to.
   */
  _targetControllers: FieldController[];
  _field: Field & ScrollToErrorMixin;
  _element: Element | null;
}

function hasVisibleError(controller: FieldController): boolean {
  if (controller._element === null || controller._field.error === null) {
    return false;
  }

  const rect = controller._element.getBoundingClientRect();

  // Exclude non-displayed elements
  return rect.top !== 0 || rect.left !== 0 || rect.width !== 0 || rect.height !== 0;
}

/**
 * Sorts controllers by their visual position.
 *
 * @param controllers The controllers to sort. All controllers must have a ref with an element.
 * @param rtl The sorting order for elements.
 */
function sortByBoundingRect(controllers: FieldController[], rtl: boolean): FieldController[] {
  const { body, documentElement } = document;

  const scrollY = window.pageYOffset || documentElement.scrollTop || body.scrollTop;
  const clientY = documentElement.clientTop || body.clientTop || 0;

  const scrollX = window.pageXOffset || documentElement.scrollLeft || body.scrollLeft;
  const clientX = documentElement.clientLeft || body.clientLeft || 0;

  return controllers.sort((controller1, controller2) => {
    const rect1 = controller1._element!.getBoundingClientRect();
    const rect2 = controller2._element!.getBoundingClientRect();

    const y1 = Math.round(rect1.top + scrollY - clientY);
    const y2 = Math.round(rect2.top + scrollY - clientY);

    const x1 = Math.round(rect1.left + scrollX - clientX);
    const x2 = Math.round(rect2.left + scrollX - clientX);

    return y1 - y2 || (rtl ? x1 - x2 : x2 - x1);
  });
}
