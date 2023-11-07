import { Field, PluginCallback } from './typings';
import { isEqual } from './utils';
import { InferPlugin } from './typings';

/**
 * The plugin that enables field value validation.
 *
 * @template Error The validation error.
 * @template Options Options passed to the validator.
 */
export interface ValidationPlugin<Error = any, Options = any> {
  /**
   * A validation error associated with the field, or `null` if there's no error.
   */
  error: Error | null;

  /**
   * `true` if this field or any of its descendants have no associated errors, or `false` otherwise.
   */
  readonly isInvalid: boolean;

  /**
   * `true` if an async validation is pending, or `false` otherwise.
   */
  readonly isValidating: boolean;

  /**
   * The total number of errors associated with this field and its child fields.
   */
  ['errorCount']: number;

  /**
   * The type of the associated error:
   * - `external` if an error was set using {@link ValidationPlugin.setError};
   * - `validation` if an error was set using {@link ValidationPlugin.setValidationError};
   * - `null` if there's no associated error.
   */
  ['errorType']: 'external' | 'validation' | null;

  /**
   * The validator to which the field value validation is delegated.
   */
  ['validator']: Validator;

  /**
   * The field that initiated the validation, or `null` if there's no pending validation.
   */
  ['validationRoot']: Field<any, InferPlugin<this>> | null;

  /**
   * The abort controller that aborts the signal passed to {@link Validator.validateAsync}, or `null` if there's no
   * pending async validation.
   */
  ['validationAbortController']: AbortController | null;

  /**
   * Associates an error with the field and notifies the subscribers.
   *
   * @param error The error to set.
   */
  setError(error: Error): void;

  /**
   * Deletes an error associated with this field.
   */
  deleteError(): void;

  /**
   * Recursively deletes errors associated with this field and all of its derived fields.
   */
  clearErrors(): void;

  /**
   * Returns all fields that have an error.
   */
  getInvalidFields(): Field<any, InferPlugin<this>>[];

  /**
   * Triggers a sync field validation. Starting a validation will clear errors that were set during the previous
   * validation and preserve errors set via {@link setError}. If you want to clear all errors before the validation,
   * use {@link clearErrors}.
   *
   * @param options Options passed to the validator.
   * @returns `true` if {@link isInvalid field is valid}, or `false` otherwise.
   */
  validate(options?: Options): boolean;

  /**
   * Triggers an async field validation. Starting a validation will clear errors that were set during the previous
   * validation and preserve errors set via {@link setError}. If you want to clear all errors before the validation,
   * use {@link clearErrors}.
   *
   * @param options Options passed to the validator.
   * @returns `true` if {@link isInvalid field is valid}, or `false` otherwise.
   */
  validateAsync(options?: Options): Promise<boolean>;

  /**
   * Aborts async validation of the field or no-op if there's no pending validation. If the field's parent is being
   * validated then parent validation proceeds but this field won't be updated with validation errors.
   */
  abortValidation(): void;

  /**
   * Associates an internal error with the field and notifies the subscribers. Use this method in
   * {@link Validator validators} to set errors that would be overridden during the next validation.
   *
   * @param error The error to set.
   */
  ['setValidationError'](error: Error): void;
}

/**
 * The validator implements the validation rules.
 *
 * @template Error The validation error.
 * @template Options Options passed to the validator.
 */
export interface Validator<Error = any, Options = any> {
  /**
   * The callback that applies validation rules to a field.
   *
   * Set {@link ValidationPlugin.setValidationError validation errors} to invalid fields during validation.
   *
   * @param field The field where {@link ValidationPlugin.validate} was called.
   * @param options The options passed to the {@link ValidationPlugin.validate} method.
   */
  validate(field: Field<any, ValidationPlugin<Error, Options>>, options: Options | undefined): void;

  /**
   * The callback that applies validation rules to a field.
   *
   * Check that {@link ValidationPlugin.validationAbortController validation isn't aborted} before
   * {@link ValidationPlugin.setValidationError setting a validation error}, otherwise stop validation as soon as
   * possible.
   *
   * If this callback is omitted, then {@link validate} would be called instead.
   *
   * @param field The field where {@link ValidationPlugin.validateAsync} was called.
   * @param options The options passed to the {@link ValidationPlugin.validateAsync} method.
   */
  validateAsync?(field: Field<any, ValidationPlugin<Error, Options>>, options: Options | undefined): Promise<void>;
}

/**
 * Enhances the field with validation methods.
 *
 * This plugin is a scaffold for implementing validation. If you don't know how to validate your fields then it is
 * highly likely that this is not the plugin you're looking for. Have a look at
 * [library-based validation plugins](https://github.com/smikhalevski/roqueform#plugins-and-integrations) instead.
 *
 * @param validator The callback or an object with `validate` and optional `validateAsync` methods that applies
 * validation rules to a provided field.
 * @template Error The validation error.
 * @template Options Options passed to the validator.
 * @template Value The root field value.
 */
export function validationPlugin<Error = any, Options = void, Value = any>(
  validator: Validator<Error, Options> | Validator<Error, Options>['validate']
): PluginCallback<ValidationPlugin<Error, Options>, Value> {
  return field => {
    field.error = null;
    field.errorCount = 0;
    field.errorType = null;
    field.validator = typeof validator === 'function' ? { validate: validator } : validator;
    field.validationRoot = null;
    field.validationAbortController = null;

    Object.defineProperties(field, {
      isInvalid: { get: () => field.errorCount !== 0 },
      isValidating: { get: () => field.validationRoot !== null },
    });

    const { setValue, setTransientValue } = field;

    // field.setError = null;
    // field.deleteError = null;
    // field.clearErrors = null;
    // field.getInvalidFields = null;
    // field.validate = null;
    // field.validateAsync = null;
    // field.abortValidation = null;
    // field.setValidationError = null;

    field.setValue = value => {
      if (field.validationRoot !== null) {
        callAll(endValidation(field, field.validationRoot, true, []));
      }
      setValue(value);
    };

    field.setTransientValue = value => {
      if (controller.validationRoot !== null) {
        callAll(endValidation(controller, controller.validationRoot, true, []));
      }
      setTransientValue(value);
    };

    field.setError = error => {
      callAll(setError(controller, error, false, []));
    };

    field.deleteError = () => {
      callAll(deleteError(controller, false, []));
    };

    field.clearErrors = () => {
      callAll(clearErrors(controller, false, []));
    };

    field.validate = options => validate(controller, options);

    field.validateAsync = options => validateAsync(controller, options);

    field.abortValidation = () => {
      callAll(endValidation(controller, controller, true, []));
    };
  };
}

interface FieldController {
  _parent: FieldController | null;
  _children: FieldController[] | null;
  _field: Field;

  /**
   * The total number of errors associated with the field and its derived fields.
   */
  _errorCount: number;

  /**
   * `true` if this field has an associated error, or `false` otherwise.
   */
  _isErrored: boolean;
  _error: unknown | null;

  /**
   * `true` if an error was set internally by {@link ValidationMixin.validate}, or `false` if an issue was set by
   * the user through {@link ValidationMixin.setError}.
   */
  _isInternal: boolean;
  _validator: Validator<unknown, unknown>;

  /**
   * The controller that initiated the subtree validation, or `null` if there's no pending validation.
   */
  _initiator: FieldController | null;

  /**
   * The number that is incremented every time a validation is started for {@link _field}.
   */
  _validationNonce: number;

  /**
   * The abort controller that aborts the signal passed to {@link Validator.validateAsync}.
   */
  _abortController: AbortController | null;

  /**
   * The controller map that maps all fields to a corresponding controller.
   */
  _controllerMap: WeakMap<Field, FieldController>;

  /**
   * Synchronously notifies listeners of the field.
   */
  _notify: () => void;
}

/**
 * Associates a validation error with the field.
 *
 * @param controller The controller for which an error is set.
 * @param error An error to set.
 * @param internal Must be `true` if an error is set internally (during {@link ValidationMixin.validate} call), or
 * `false` if an error is set using {@link ValidationMixin.setError} call.
 * @param notifyCallbacks The in-out array of callbacks that notify affected fields.
 * @returns An array of callbacks that notify affected fields.
 */
function setError(
  controller: FieldController,
  error: unknown,
  internal: boolean,
  notifyCallbacks: Array<() => void>
): Array<() => void> {
  if (controller._isErrored && isEqual(controller._error, error) && controller._isInternal === internal) {
    return notifyCallbacks;
  }

  controller._error = error;
  controller._isInternal = internal;

  notifyCallbacks.push(controller._notify);

  if (controller._isErrored) {
    return notifyCallbacks;
  }

  controller._errorCount++;
  controller._isErrored = true;

  for (let ancestor = controller._parent; ancestor !== null; ancestor = ancestor._parent) {
    if (ancestor._errorCount++ === 0) {
      notifyCallbacks.push(ancestor._notify);
    }
  }

  return notifyCallbacks;
}

/**
 * Deletes a validation error from the field.
 *
 * @param controller The controller for which an error must be deleted.
 * @param internal If `true` then only errors set by {@link ValidationMixin.validate} are deleted, otherwise all errors
 * are deleted.
 * @param notifyCallbacks The in-out array of callbacks that notify affected fields.
 * @returns An array of callbacks that notify affected fields.
 */
function deleteError(
  controller: FieldController,
  internal: boolean,
  notifyCallbacks: Array<() => void>
): Array<() => void> {
  if (!controller._isErrored || (internal && !controller._isInternal)) {
    return notifyCallbacks;
  }

  controller._error = null;
  controller._errorCount--;
  controller._isInternal = controller._isErrored = false;

  notifyCallbacks.push(controller._notify);

  for (let ancestor = controller._parent; ancestor !== null; ancestor = ancestor._parent) {
    if (--ancestor._errorCount === 0) {
      notifyCallbacks.push(ancestor._notify);
    }
  }

  return notifyCallbacks;
}

/**
 * Recursively deletes errors associated with the field and all of its derived fields.
 *
 * @param controller The controller tree root.
 * @param internal If `true` then only errors set by {@link ValidationMixin.validate} are deleted, otherwise all errors
 * are deleted.
 * @param notifyCallbacks The in-out array of callbacks that notify affected fields.
 * @returns An array of callbacks that notify affected fields.
 */
function clearErrors(
  controller: FieldController,
  internal: boolean,
  notifyCallbacks: Array<() => void>
): Array<() => void> {
  deleteError(controller, internal, notifyCallbacks);

  if (controller._children !== null) {
    for (const child of controller._children) {
      clearErrors(child, internal, notifyCallbacks);
    }
  }
  return notifyCallbacks;
}

/**
 * Marks the controller as being validated by assigning an initiator to the controller and all of its children.
 *
 * @param controller The controller to which the initiator must be assigned.
 * @param initiator The controller that initiated the validation process.
 * @param notifyCallbacks The in-out array of callbacks that notify affected fields.
 * @returns An array of callbacks that notify affected fields.
 */
function beginValidation(
  controller: FieldController,
  initiator: FieldController,
  notifyCallbacks: Array<() => void>
): Array<() => void> {
  controller.validationRoot = initiator;

  if (initiator._abortController) {
    notifyCallbacks.push(controller._notify);
  }

  if (controller._children !== null) {
    for (const child of controller._children) {
      if (!child._field.isTransient) {
        beginValidation(child, initiator, notifyCallbacks);
      }
    }
  }
  return notifyCallbacks;
}

/**
 * Aborts the pending validation that was begun by the initiator.
 *
 * @param controller The controller that is being validated.
 * @param initiator The controller that initiated validation process.
 * @param aborted If `true` then the abort signal is aborted, otherwise it is ignored.
 * @param notifyCallbacks The in-out array of callbacks that notify affected fields.
 * @returns An array of callbacks that notify affected fields.
 */
function endValidation(
  controller: FieldController,
  initiator: FieldController,
  aborted: boolean,
  notifyCallbacks: Array<() => void>
): Array<() => void> {
  if (controller.validationRoot !== initiator) {
    return notifyCallbacks;
  }

  controller.validationRoot = null;

  if (initiator._abortController) {
    notifyCallbacks.push(controller._notify);
  }

  if (controller._children !== null) {
    for (const child of controller._children) {
      endValidation(child, initiator, aborted, notifyCallbacks);
    }
  }

  if (controller._abortController !== null) {
    if (aborted) {
      controller._abortController.abort();
    }
    controller._abortController = null;
  }

  return notifyCallbacks;
}

/**
 * Synchronously validates the field and its derived fields and notifies them on change.
 *
 * @param controller The controller that must be validated.
 * @param options Options passed to the validator.
 * @returns The array of validation errors, or `null` if there are no errors.
 */
function validate(controller: FieldController, options: unknown): any[] | null {
  const notifyCallbacks: Array<() => void> = [];

  if (controller.validationRoot === controller) {
    endValidation(controller, controller, true, notifyCallbacks);
  }

  clearErrors(controller, true, notifyCallbacks);
  beginValidation(controller, controller, notifyCallbacks);

  const validationNonce = ++controller._validationNonce;

  let errors: unknown[] | null = null;

  const setErrorCallback = (targetField: Field, error: unknown): void => {
    const targetController = controller._controllerMap.get(targetField);
    if (
      targetController !== undefined &&
      targetController.validationRoot === controller &&
      controller._validationNonce === validationNonce
    ) {
      (errors ||= []).push(error);
      setError(targetController, error, true, notifyCallbacks);
    }
  };

  try {
    controller._validator.validate(controller._field, setErrorCallback, options);
  } catch (error) {
    callAll(endValidation(controller, controller, false, notifyCallbacks));
    throw error;
  }

  callAll(endValidation(controller, controller, false, notifyCallbacks));
  return errors;
}

/**
 * Asynchronously validates the field and its derived fields and notifies them on change.
 *
 * @param controller The controller that must be validated.
 * @param options Options passed to the validator.
 * @returns The array of validation errors, or `null` if there are no errors.
 */
function validateAsync(controller: FieldController, options: unknown): Promise<any[] | null> {
  const notifyCallbacks: Array<() => void> = [];

  if (controller.validationRoot === controller) {
    endValidation(controller, controller, true, notifyCallbacks);
  }

  controller._abortController = new AbortController();

  clearErrors(controller, true, notifyCallbacks);
  beginValidation(controller, controller, notifyCallbacks);

  const abortSignal = controller._abortController.signal;
  const validationNonce = ++controller._validationNonce;

  callAll(notifyCallbacks);

  let errors: unknown[] | null = null;

  const setErrorCallback = (targetField: Field, error: unknown): void => {
    const targetController = controller._controllerMap.get(targetField);
    if (
      targetController !== undefined &&
      targetController.validationRoot === controller &&
      controller._validationNonce === validationNonce
    ) {
      (errors ||= []).push(error);
      callAll(setError(targetController, error, true, []));
    }
  };

  const { validate, validateAsync = validate } = controller._validator;

  return Promise.race([
    new Promise(resolve => {
      // noinspection JSVoidFunctionReturnValueUsed
      resolve(validateAsync(controller._field, setErrorCallback, options, abortSignal));
    }),
    new Promise((_resolve, reject) => {
      abortSignal.addEventListener('abort', () => reject(new Error('Validation aborted')));
    }),
  ]).then(
    () => {
      callAll(endValidation(controller, controller, false, []));
      return errors;
    },
    error => {
      callAll(endValidation(controller, controller, false, []));
      throw error;
    }
  );
}
