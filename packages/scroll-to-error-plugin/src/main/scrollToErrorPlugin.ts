import { Field, Plugin } from 'roqueform';
import { RefObject } from 'react';

/**
 * The mixin added to fields by {@linkcode scrollToErrorPlugin}.
 */
export interface ScrollToErrorPlugin {
  /**
   * Scroll to the element that is referenced by a field that has an associated error. Scrolls the field element's
   * ancestor containers such that the field element is visible to the user.
   *
   * The field `ref` should be populated with an HTML element reference.
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
   * The field `ref` should be populated with an HTML element reference.
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
 * @param plugin The plugin that enhances field with `ref` and `getIssue` properties.
 * @template T The root field value.
 * @returns The plugin.
 */
export function scrollToErrorPlugin<T, E extends HTMLElement, P extends { ref: RefObject<E>; error: any }>(
  plugin: Plugin<T, P>
): Plugin<T, P & ScrollToErrorPlugin> {
  return (field, accessor) => {
    enhanceField((plugin(field, accessor) || field) as InternalField);
  };
}

/**
 * @internal
 * The property that holds a controller instance.
 *
 * **Note:** Controller isn't intended to be accessed outside the plugin internal functions.
 */
const CONTROLLER_SYMBOL = Symbol('scrollToErrorPlugin.controller');

/**
 * @internal
 * Retrieves a controller for the field instance.
 */
function getController(field: any): FieldController {
  return field[CONTROLLER_SYMBOL];
}

/**
 * @internal
 */
interface InternalField extends Field {
  ref: RefObject<HTMLElement>;
  error: unknown;
}

/**
 * @internal
 */
interface FieldController {
  __parent: FieldController | null;
  __descendants: FieldController[] | null;
  __field: InternalField;
}

/**
 * @internal
 */
function enhanceField(field: InternalField): void {
  const controller: FieldController = {
    __parent: null,
    __descendants: null,
    __field: field,
  };

  if (field.parent !== null) {
    const parent = getController(field.parent);

    controller.__parent = parent;

    parent.__descendants ||= [];
  }

  for (let parent = controller.__parent; parent !== null; parent = controller.__parent) {
    parent.__descendants!.push(controller);
  }

  Object.defineProperty(field, CONTROLLER_SYMBOL, { value: controller, enumerable: true });

  Object.assign<Field, ScrollToErrorPlugin>(field, {
    scrollToError(index = 0, options) {
      if (controller.__descendants === null) {
        return false;
      }
      const controllers = controller.__descendants.filter(hasVisibleError);

      if (controllers.length === 0) {
        return false;
      }
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
  return controller.__field.ref.current !== null && controller.__field.error != null;
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
