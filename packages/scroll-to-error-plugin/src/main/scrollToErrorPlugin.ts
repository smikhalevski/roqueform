import type { Field, Plugin } from 'roqueform';
import type { RefObject } from 'react';

/**
 * The enhancement added to fields by the {@linkcode scrollToErrorPlugin}.
 */
export interface ScrollToErrorPlugin {
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
  scrollToError(index?: number, options?: ScrollIntoViewOptions): boolean;
}

/**
 * @param plugin The plugin that enhances field with `ref` and `error` properties.
 * @template T The root field value.
 * @template E The element type stored by ref.
 * @template P The enhancement added by the ref and validation plugins.
 * @returns The plugin.
 */
export function scrollToErrorPlugin<T, E extends Element, P extends { ref: RefObject<E>; error: any }>(
  plugin: Plugin<T, P>
): Plugin<T, P & ScrollToErrorPlugin> {
  let controllerMap: WeakMap<Field, FieldController> | undefined;

  return (field, accessor) => {
    controllerMap ||= new WeakMap();

    const scrollField = (plugin(field, accessor) || field) as ScrollField;

    if (!controllerMap.has(scrollField)) {
      enhanceField(scrollField, controllerMap);
    }
  };
}

interface ScrollField extends Field {
  ref: RefObject<Element>;
  error: unknown;
}

interface FieldController {
  __parent: FieldController | null;

  /**
   * The list of controllers that can be scrolled to.
   */
  __targetControllers: FieldController[];
  __field: ScrollField;
}

function enhanceField(field: ScrollField, controllerMap: WeakMap<Field, FieldController>): void {
  const controller: FieldController = {
    __parent: field.parent !== null ? controllerMap.get(field.parent)! : null,
    __targetControllers: [],
    __field: field,
  };

  controllerMap.set(field, controller);

  for (let parent: FieldController | null = controller; parent !== null; parent = parent.__parent) {
    parent.__targetControllers!.push(controller);
  }

  Object.assign<Field, ScrollToErrorPlugin>(field, {
    scrollToError(index = 0, options) {
      const controllers = controller.__targetControllers.filter(hasVisibleError);
      const targetController = sortByBoundingRect(controllers)[index < 0 ? controllers.length + index : index];

      if (targetController === undefined) {
        return false;
      }
      targetController.__field.ref.current!.scrollIntoView(options);
      return true;
    },
  });
}

function hasVisibleError(controller: FieldController): boolean {
  const element = controller.__field.ref.current;

  if (!(element instanceof Element) || controller.__field.error == null) {
    return false;
  }

  const rect = element.getBoundingClientRect();

  // Exclude non-displayed elements
  return rect.top !== 0 || rect.left !== 0 || rect.width !== 0 || rect.height !== 0;
}

/**
 * Sorts controllers by their visual position left-to-right and top-to-bottom.
 */
function sortByBoundingRect(controllers: FieldController[]): FieldController[] {
  const { body, documentElement } = document;

  const scrollY = window.pageYOffset || documentElement.scrollTop || body.scrollTop;
  const clientY = documentElement.clientTop || body.clientTop || 0;

  const scrollX = window.pageXOffset || documentElement.scrollLeft || body.scrollLeft;
  const clientX = documentElement.clientLeft || body.clientLeft || 0;

  return controllers.sort((controller1, controller2) => {
    const rect1 = controller1.__field.ref.current!.getBoundingClientRect();
    const rect2 = controller2.__field.ref.current!.getBoundingClientRect();

    const y1 = Math.round(rect1.top + scrollY - clientY);
    const y2 = Math.round(rect2.top + scrollY - clientY);

    const x1 = Math.round(rect1.left + scrollX - clientX);
    const x2 = Math.round(rect2.left + scrollX - clientX);

    return y1 - y2 || x1 - x2;
  });
}
