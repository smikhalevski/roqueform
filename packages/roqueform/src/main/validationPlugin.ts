import { Field, Plugin } from './public-types';
import { Mutable } from './utils';
import { callAll, isEqual } from './public-utils';

/**
 * The enhancement added to fields by the {@linkcode validationPlugin}.
 *
 * @template E The error associated with the field.
 * @template O Options passed to the validator.
 */
export interface ValidationPlugin<E, O> {
  /**
   * `true` if an async validation is pending, or `false` otherwise.
   */
  readonly validating: boolean;

  /**
   * `true` if the field or any of its derived fields have an associated error, or `false` otherwise.
   */
  readonly invalid: boolean;

  /**
   * An error associated with the field, or `null` if there's no error.
   */
  readonly error: E | null;

  /**
   * Associates an error to the field and notifies the subscribers.
   *
   * @param error The error to set.
   */
  setError(error: E): void;

  /**
   * Deletes an error associated with this field.
   */
  deleteError(): void;

  /**
   * Recursively deletes errors associated with this field and all of its derived fields.
   */
  clearErrors(): void;

  /**
   * Triggers a sync field validation. Starting a validation will clear errors that were set during the previous
   * validation and preserve errors set manually by {@linkcode setError}. If you want to clear all errors before the
   * validation, use {@linkcode clearErrors}.
   *
   * @param options Options passed to the validator.
   * @returns The list of validation errors, or `null` if there are no errors.
   */
  validate(options?: O): E[] | null;

  /**
   * Triggers an async field validation. Starting a validation will clear errors that were set during the previous
   * validation and preserve errors set manually by {@linkcode setError}. If you want to clear all errors before the
   * validation, use {@linkcode clearErrors}.
   *
   * @param options Options passed to the validator.
   * @returns The list of validation errors, or `null` if there are no errors.
   */
  validateAsync(options?: O): Promise<E[] | null>;

  /**
   * Aborts async validation of the field or no-op if there's no pending validation. If the field's parent is being
   * validated then parent validation proceeds but this field won't be updated with validation errors.
   */
  abortValidation(): void;
}

/**
 * The validator implements the library-specific validation logic.
 *
 * @template E The error associated with the field.
 * @template O Options passed to the validator.
 */
export interface Validator<E, O> {
  /**
   * The callback that applies validation rules to a field.
   *
   * @param field The field where {@linkcode ValidationPlugin.validate} was called.
   * @param setInternalError The callback that sets an internal error to a field, so it can be cleared automatically if
   * another validation is started.
   * @param options The options passed to the {@linkcode ValidationPlugin.validate} method.
   */
  validate(field: Field, setInternalError: (field: Field, error: E) => void, options: O | undefined): void;

  /**
   * The callback that applies validation rules to a field.
   *
   * @param field The field where {@linkcode ValidationPlugin.validate} was called.
   * @param setInternalError The callback that sets an internal error to a field, so it can be cleared automatically if
   * another validation is started.
   * @param options The options passed to the {@linkcode ValidationPlugin.validate} method.
   * @param signal The signal that is aborted if the validation process should be stopped.
   */
  validateAsync?(
    field: Field,
    setInternalError: (field: Field, error: E) => void,
    options: O | undefined,
    signal: AbortSignal
  ): Promise<void>;
}

/**
 * Enhances the field with validation methods.
 *
 * This plugin is a scaffold for implementing validation. If you don't know how to validate your fields then it is
 * highly likely that this is not the plugin you're looking for. Have a look at
 * [library-based validation plugins](https://github.com/smikhalevski/roqueform#validation) instead.
 *
 * @param validator The callback or an object with `validate` and optional `validateAsync` methods that applies
 * validation rules to a provided field.
 * @template T The field value.
 * @template E The error associated with the field.
 * @template O Options passed to the validator.
 * @returns The plugin.
 */
export function validationPlugin<T, E, O>(
  validator: Validator<E, O> | Validator<E, O>['validate']
): Plugin<T, ValidationPlugin<E, O>> {
  let controllerMap: WeakMap<Field, FieldController> | undefined;

  return field => {
    controllerMap ||= new WeakMap();

    if (!controllerMap.has(field)) {
      enhanceField(field, typeof validator === 'function' ? { validate: validator } : validator, controllerMap);
    }
  };
}

interface FieldController {
  __parent: FieldController | null;
  __children: FieldController[] | null;
  __field: Field & Mutable<ValidationPlugin<unknown, unknown>>;

  /**
   * The total number of errors associated with the field and its derived fields.
   */
  __errorCount: number;

  /**
   * `true` if this field has an associated error, or `false` otherwise.
   */
  __errored: boolean;
  __error: unknown | null;

  /**
   * `true` if an error was set internally by {@linkcode ValidationPlugin.validate}, or `false` if an issue was set by
   * the user through {@linkcode ValidationPlugin.setError}.
   */
  __internal: boolean;
  __validator: Validator<unknown, unknown>;

  /**
   * The controller that initiated the subtree validation, or `null` if there's no pending validation.
   */
  __initiator: FieldController | null;

  /**
   * The number that is incremented every time a validation is started for {@linkcode __field}.
   */
  __validationNonce: number;

  /**
   * The abort controller that aborts the signal passed to {@linkcode Validator.validateAsync}.
   */
  __abortController: AbortController | null;

  /**
   * The controller map that maps all fields to a corresponding controller.
   */
  __controllerMap: WeakMap<Field, FieldController>;
}

function enhanceField(
  field: Field,
  validator: Validator<unknown, unknown>,
  controllerMap: WeakMap<Field, FieldController>
): void {
  const controller: FieldController = {
    __parent: null,
    __children: null,
    __field: field as Field & Mutable<ValidationPlugin<unknown, unknown>>,
    __errorCount: 0,
    __errored: false,
    __error: null,
    __internal: false,
    __validator: validator,
    __initiator: null,
    __validationNonce: 0,
    __abortController: null,
    __controllerMap: controllerMap,
  };

  controllerMap.set(field, controller);

  if (field.parent !== null) {
    const parent = controllerMap.get(field.parent)!;

    controller.__parent = parent;
    controller.__initiator = parent.__initiator;

    (parent.__children ||= []).push(controller);
  }

  const { setTransientValue, setValue } = field;

  // noinspection JSUnusedGlobalSymbols
  Object.assign<Field, Pick<Field, 'setTransientValue' | 'setValue'> & ValidationPlugin<unknown, unknown>>(field, {
    validating: controller.__initiator !== null,
    invalid: false,
    error: null,

    setTransientValue(value) {
      try {
        if (controller.__initiator !== null) {
          callAll(endValidation(controller, controller.__initiator, true, []));
        }
      } finally {
        setTransientValue(value);
      }
    },
    setValue(value) {
      try {
        if (controller.__initiator !== null) {
          callAll(endValidation(controller, controller.__initiator, true, []));
        }
      } finally {
        setValue(value);
      }
    },
    setError(error) {
      callAll(setError(controller, error, false, []));
    },
    deleteError() {
      callAll(deleteError(controller, false, []));
    },
    clearErrors() {
      callAll(clearErrors(controller, false, []));
    },
    validate(options) {
      return validate(controller, options);
    },
    validateAsync(options) {
      return validateAsync(controller, options);
    },
    abortValidation() {
      callAll(endValidation(controller, controller, true, []));
    },
  });
}

/**
 * Associates a validation error with the field.
 *
 * @param controller The controller for which an error is set.
 * @param error An error to set.
 * @param internal Must be `true` if an error is set internally (during {@linkcode ValidationPlugin.validate} call), or
 * `false` if an error is set using {@linkcode ValidationPlugin.setError} call.
 * @param notifyCallbacks The in-out array of callbacks that notify affected fields.
 * @returns An array of callbacks that notify affected fields.
 */
function setError(
  controller: FieldController,
  error: unknown,
  internal: boolean,
  notifyCallbacks: Field['notify'][]
): Field['notify'][] {
  if (controller.__errored && isEqual(controller.__error, error) && controller.__internal === internal) {
    return notifyCallbacks;
  }

  controller.__field.error = controller.__error = error;
  controller.__field.invalid = true;
  controller.__internal = internal;

  notifyCallbacks.push(controller.__field.notify);

  if (controller.__errored) {
    return notifyCallbacks;
  }

  controller.__errorCount++;
  controller.__errored = true;

  for (let parent = controller.__parent; parent !== null; parent = parent.__parent) {
    if (parent.__errorCount++ === 0) {
      parent.__field.invalid = true;
      notifyCallbacks.push(parent.__field.notify);
    }
  }

  return notifyCallbacks;
}

/**
 * Deletes a validation error from the field.
 *
 * @param controller The controller for which an error must be deleted.
 * @param internal If `true` then only errors set by {@linkcode ValidationPlugin.validate} are deleted, otherwise all
 * errors are deleted.
 * @param notifyCallbacks The in-out array of callbacks that notify affected fields.
 * @returns An array of callbacks that notify affected fields.
 */
function deleteError(
  controller: FieldController,
  internal: boolean,
  notifyCallbacks: Field['notify'][]
): Field['notify'][] {
  if (!controller.__errored || (internal && !controller.__internal)) {
    return notifyCallbacks;
  }

  controller.__field.error = controller.__error = null;
  controller.__field.invalid = --controller.__errorCount !== 0;
  controller.__internal = controller.__errored = false;

  notifyCallbacks.push(controller.__field.notify);

  for (let parent = controller.__parent; parent !== null; parent = parent.__parent) {
    if (--parent.__errorCount === 0) {
      parent.__field.invalid = false;
      notifyCallbacks.push(parent.__field.notify);
    }
  }

  return notifyCallbacks;
}

/**
 * Recursively deletes errors associated with the field and all of its derived fields.
 *
 * @param controller The controller tree root.
 * @param internal If `true` then only errors set by {@linkcode ValidationPlugin.validate} are deleted, otherwise all
 * errors are deleted.
 * @param notifyCallbacks The in-out array of callbacks that notify affected fields.
 * @returns An array of callbacks that notify affected fields.
 */
function clearErrors(
  controller: FieldController,
  internal: boolean,
  notifyCallbacks: Field['notify'][]
): Field['notify'][] {
  deleteError(controller, internal, notifyCallbacks);

  if (controller.__children !== null) {
    for (const child of controller.__children) {
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
  notifyCallbacks: Field['notify'][]
): Field['notify'][] {
  controller.__initiator = initiator;
  controller.__field.validating = true;

  notifyCallbacks.push(controller.__field.notify);

  if (controller.__children !== null) {
    for (const child of controller.__children) {
      if (!child.__field.transient) {
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
  notifyCallbacks: Field['notify'][]
): Field['notify'][] {
  if (controller.__initiator !== initiator) {
    return notifyCallbacks;
  }

  if (controller.__abortController !== null) {
    if (aborted) {
      controller.__abortController.abort();
    }
    controller.__abortController = null;
  }

  controller.__initiator = null;
  controller.__field.validating = false;

  notifyCallbacks.push(controller.__field.notify);

  if (controller.__children !== null) {
    for (const child of controller.__children) {
      endValidation(child, initiator, aborted, notifyCallbacks);
    }
  }
  return notifyCallbacks;
}

/**
 * Synchronously validates the field and its derived fields and notifies them on change.
 *
 * @param controller The controller that must be validated.
 * @param options Options passed to the validator.
 * @returns The list of validation errors, or `null` if there are no errors.
 */
function validate(controller: FieldController, options: unknown): unknown[] | null {
  const notifyCallbacks: Field['notify'][] = [];

  if (controller.__initiator === controller) {
    endValidation(controller, controller, true, notifyCallbacks);
  }

  clearErrors(controller, true, notifyCallbacks);
  beginValidation(controller, controller, notifyCallbacks);

  const validationNonce = ++controller.__validationNonce;

  let errors: unknown[] | null = null;

  const setInternalError = (targetField: Field, error: unknown): void => {
    const targetController = controller.__controllerMap.get(targetField);
    if (
      targetController !== undefined &&
      targetController.__initiator === controller &&
      controller.__validationNonce === validationNonce
    ) {
      (errors ||= []).push(error);
      setError(targetController, error, true, notifyCallbacks);
    }
  };

  try {
    controller.__validator.validate(controller.__field, setInternalError, options);
  } catch (e) {
    try {
      callAll(endValidation(controller, controller, false, notifyCallbacks));
    } catch {}
    throw e;
  }

  callAll(endValidation(controller, controller, false, notifyCallbacks));
  return errors;
}

/**
 * Asynchronously validates the field and its derived fields and notifies them on change.
 *
 * @param controller The controller that must be validated.
 * @param options Options passed to the validator.
 * @returns The list of validation errors, or `null` if there are no errors.
 */
function validateAsync(controller: FieldController, options: unknown): Promise<unknown[] | null> {
  const notifyCallbacks: Field['notify'][] = [];

  if (controller.__initiator === controller) {
    endValidation(controller, controller, true, notifyCallbacks);
  }

  clearErrors(controller, true, notifyCallbacks);
  beginValidation(controller, controller, notifyCallbacks);

  controller.__abortController = new AbortController();

  const abortSignal = controller.__abortController.signal;
  const validationNonce = ++controller.__validationNonce;

  callAll(notifyCallbacks);

  let errors: unknown[] | null = null;

  const setInternalError = (targetField: Field, error: unknown): void => {
    const targetController = controller.__controllerMap.get(targetField);
    if (
      targetController !== undefined &&
      targetController.__initiator === controller &&
      controller.__validationNonce === validationNonce
    ) {
      (errors ||= []).push(error);
      callAll(setError(targetController, error, true, []));
    }
  };

  const { validate, validateAsync = validate } = controller.__validator;

  return Promise.race([
    new Promise(resolve => {
      // noinspection JSVoidFunctionReturnValueUsed
      resolve(validateAsync(controller.__field, setInternalError, options, abortSignal));
    }),
    new Promise((resolve, reject) => {
      abortSignal.addEventListener('abort', () => reject(new Error('Aborted')));
    }),
  ]).then(
    () => {
      callAll(endValidation(controller, controller, false, []));
      return errors;
    },
    error => {
      try {
        callAll(endValidation(controller, controller, false, []));
      } catch {}
      throw error;
    }
  );
}
