/**
 * ```sh
 * npm install --save-prod roqueform
 * ```
 *
 * @module roqueform
 */

export { composePlugins } from './composePlugins';
export { createField } from './createField';
export { errorsPlugin } from './errorsPlugin';
export { naturalValueAccessor } from './naturalValueAccessor';
export { dispatchEvents, isEqual, callOrGet } from './utils';
export { validationPlugin } from './validationPlugin';

export type { ClearErrorsOptions, ErrorsPlugin } from './errorsPlugin';
export type { Validator, Validation, ValidationPlugin } from './validationPlugin';
export type {
  Field,
  Event,
  Subscriber,
  Unsubscribe,
  PluginOf,
  ValueOf,
  FieldController,
  PluginInjector,
  ValueAccessor,
} from './types';
