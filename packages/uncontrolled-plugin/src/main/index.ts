/**
 * Updates Roqueform fields by listening to change events of associated DOM elements.
 *
 * ```sh
 * npm install --save-prod @roqueform/uncontrolled-plugin
 * ```
 *
 * @module uncontrolled-plugin
 */

export { createElementsValueAccessor } from './createElementsValueAccessor';
export { uncontrolledPlugin } from './uncontrolledPlugin';
export type { ElementsValueAccessor, ElementsValueAccessorOptions } from './createElementsValueAccessor';
export type { UncontrolledPlugin } from './uncontrolledPlugin';
