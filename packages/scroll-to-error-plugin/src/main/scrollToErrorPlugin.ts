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
 * Enhances the field with methods to scroll to a field that has an associated validation error. This plugin should be
 * used in conjunction with a plugin (or multiple plugins) that adds `ref` and `error` properties to a field.
 *
 * @template T The root field value.
 * @returns The plugin.
 */
export function scrollToErrorPlugin<T>(): Plugin<T, ScrollToErrorPlugin> {
  let controllerMap: WeakMap<Field, FieldController> | undefined;

  return field => {
    controllerMap ||= new WeakMap();

    if (!controllerMap.has(field)) {
      enhanceField(field, controllerMap);
    }
  };
}

interface EnhancedField extends Field {
  ref?: RefObject<Element>;
  error?: unknown;
}

interface FieldController {
  __parent: FieldController | null;

  /**
   * The list of controllers that can be scrolled to.
   */
  __targetControllers: FieldController[];
  __field: EnhancedField;
}

function enhanceField(field: EnhancedField, controllerMap: WeakMap<Field, FieldController>): void {
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
    scrollToError(index = 0, options?: ScrollIntoViewOptions | boolean) {
      const controllers = controller.__targetControllers.filter(hasVisibleError);
      const targetController = sortByBoundingRect(controllers)[index < 0 ? controllers.length + index : index];

      if (targetController === undefined) {
        return false;
      }
      targetController.__field.ref!.current!.scrollIntoView(options);
      return true;
    },
  });
}

function hasVisibleError(controller: FieldController): boolean {
  const { ref } = controller.__field;

  if (ref == null || !(ref.current instanceof Element) || controller.__field.error == null) {
    return false;
  }

  const rect = ref.current.getBoundingClientRect();

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
    const rect1 = controller1.__field.ref!.current!.getBoundingClientRect();
    const rect2 = controller2.__field.ref!.current!.getBoundingClientRect();

    const y1 = Math.round(rect1.top + scrollY - clientY);
    const y2 = Math.round(rect2.top + scrollY - clientY);

    const x1 = Math.round(rect1.left + scrollX - clientX);
    const x2 = Math.round(rect2.left + scrollX - clientX);

    return y1 - y2 || x1 - x2;
  });
}
