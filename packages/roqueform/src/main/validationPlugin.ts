import { Field, Plugin } from './shared-types';
import { callAll, isEqual } from './utils';

/**
 * The mixin added to fields by the {@linkcode validationPlugin}.
 *
 * @template E The validation error.
 * @template O Options passed to the validator.
 */
export interface ValidationMixin<E, O> {
  /**
   * A validation error associated with the field, or `null` if there's no error.
   */
  readonly error: E | null;

  /**
   * `true` if the field or any of its derived fields have an associated error, or `false` otherwise.
   */
  readonly invalid: boolean;

  /**
   * `true` if an async validation is pending, or `false` otherwise.
   */
  readonly validating: boolean;

  /**
   * Associates an error with the field and notifies the subscribers.
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
 * @template E The validation error.
 * @template O Options passed to the validator.
 */
export interface Validator<E, O> {
  /**
   * The callback that applies validation rules to a field.
   *
   * @param field The field where {@linkcode ValidationMixin.validate} was called.
   * @param setInternalError The callback that sets an internal error to a field, so it can be cleared automatically if
   * another validation is started.
   * @param options The options passed to the {@linkcode ValidationMixin.validate} method.
   */
  validate(field: Field, setInternalError: (field: Field, error: E) => void, options: O | undefined): void;

  /**
   * The callback that applies validation rules to a field.
   *
   * @param field The field where {@linkcode ValidationMixin.validate} was called.
   * @param setInternalError The callback that sets an internal error to a field, so it can be cleared automatically if
   * another validation is started.
   * @param options The options passed to the {@linkcode ValidationMixin.validate} method.
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
 * @template E The validation error.
 * @template O Options passed to the validator.
 * @template T The root field value.
 */
export function validationPlugin<E = any, O = void, T = any>(
  validator: Validator<E, O> | Validator<E, O>['validate']
): Plugin<ValidationMixin<E, O>, T> {
  const controllerMap = new WeakMap<Field, FieldController>();

  return field => {
    if (controllerMap.has(field)) {
      return;
    }

    const controller: FieldController = {
      _parent: null,
      _children: null,
      _field: field,
      _errorCount: 0,
      _errored: false,
      _error: null,
      _internal: false,
      _validator: typeof validator === 'function' ? { validate: validator } : validator,
      _initiator: null,
      _validationNonce: 0,
      _abortController: null,
      _controllerMap: controllerMap,
    };

    controllerMap.set(field, controller);

    if (field.parent !== null) {
      const parent = controllerMap.get(field.parent)!;

      controller._parent = parent;
      controller._initiator = parent._initiator;

      (parent._children ||= []).push(controller);
    }

    const { setTransientValue, setValue } = field;

    Object.defineProperties(field, {
      error: { enumerable: true, get: () => controller._error },
      invalid: { enumerable: true, get: () => controller._errorCount !== 0 },
      validating: { enumerable: true, get: () => controller._initiator !== null },
    });

    field.setTransientValue = value => {
      try {
        if (controller._initiator !== null) {
          callAll(endValidation(controller, controller._initiator, true, []));
        }
      } finally {
        setTransientValue(value);
      }
    };

    field.setValue = value => {
      try {
        if (controller._initiator !== null) {
          callAll(endValidation(controller, controller._initiator, true, []));
        }
      } finally {
        setValue(value);
      }
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
  _errored: boolean;
  _error: unknown | null;

  /**
   * `true` if an error was set internally by {@linkcode ValidationMixin.validate}, or `false` if an issue was set by
   * the user through {@linkcode ValidationMixin.setError}.
   */
  _internal: boolean;
  _validator: Validator<unknown, unknown>;

  /**
   * The controller that initiated the subtree validation, or `null` if there's no pending validation.
   */
  _initiator: FieldController | null;

  /**
   * The number that is incremented every time a validation is started for {@linkcode _field}.
   */
  _validationNonce: number;

  /**
   * The abort controller that aborts the signal passed to {@linkcode Validator.validateAsync}.
   */
  _abortController: AbortController | null;

  /**
   * The controller map that maps all fields to a corresponding controller.
   */
  _controllerMap: WeakMap<Field, FieldController>;
}

/**
 * Associates a validation error with the field.
 *
 * @param controller The controller for which an error is set.
 * @param error An error to set.
 * @param internal Must be `true` if an error is set internally (during {@linkcode ValidationMixin.validate} call), or
 * `false` if an error is set using {@linkcode ValidationMixin.setError} call.
 * @param notifyCallbacks The in-out array of callbacks that notify affected fields.
 * @returns An array of callbacks that notify affected fields.
 */
function setError(
  controller: FieldController,
  error: unknown,
  internal: boolean,
  notifyCallbacks: Field['notify'][]
): Field['notify'][] {
  if (controller._errored && isEqual(controller._error, error) && controller._internal === internal) {
    return notifyCallbacks;
  }

  controller._error = error;
  controller._internal = internal;

  notifyCallbacks.push(controller._field.notify);

  if (controller._errored) {
    return notifyCallbacks;
  }

  controller._errorCount++;
  controller._errored = true;

  for (let ancestor = controller._parent; ancestor !== null; ancestor = ancestor._parent) {
    if (ancestor._errorCount++ === 0) {
      notifyCallbacks.push(ancestor._field.notify);
    }
  }

  return notifyCallbacks;
}

/**
 * Deletes a validation error from the field.
 *
 * @param controller The controller for which an error must be deleted.
 * @param internal If `true` then only errors set by {@linkcode ValidationMixin.validate} are deleted, otherwise all
 * errors are deleted.
 * @param notifyCallbacks The in-out array of callbacks that notify affected fields.
 * @returns An array of callbacks that notify affected fields.
 */
function deleteError(
  controller: FieldController,
  internal: boolean,
  notifyCallbacks: Field['notify'][]
): Field['notify'][] {
  if (!controller._errored || (internal && !controller._internal)) {
    return notifyCallbacks;
  }

  controller._error = null;
  controller._errorCount--;
  controller._internal = controller._errored = false;

  notifyCallbacks.push(controller._field.notify);

  for (let ancestor = controller._parent; ancestor !== null; ancestor = ancestor._parent) {
    if (--ancestor._errorCount === 0) {
      notifyCallbacks.push(ancestor._field.notify);
    }
  }

  return notifyCallbacks;
}

/**
 * Recursively deletes errors associated with the field and all of its derived fields.
 *
 * @param controller The controller tree root.
 * @param internal If `true` then only errors set by {@linkcode ValidationMixin.validate} are deleted, otherwise all
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
  notifyCallbacks: Field['notify'][]
): Field['notify'][] {
  controller._initiator = initiator;

  notifyCallbacks.push(controller._field.notify);

  if (controller._children !== null) {
    for (const child of controller._children) {
      if (!child._field.transient) {
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
  if (controller._initiator !== initiator) {
    return notifyCallbacks;
  }

  if (controller._abortController !== null) {
    if (aborted) {
      controller._abortController.abort();
    }
    controller._abortController = null;
  }

  controller._initiator = null;

  notifyCallbacks.push(controller._field.notify);

  if (controller._children !== null) {
    for (const child of controller._children) {
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
function validate(controller: FieldController, options: unknown): any[] | null {
  const notifyCallbacks: Field['notify'][] = [];

  if (controller._initiator === controller) {
    endValidation(controller, controller, true, notifyCallbacks);
  }

  clearErrors(controller, true, notifyCallbacks);
  beginValidation(controller, controller, notifyCallbacks);

  const validationNonce = ++controller._validationNonce;

  let errors: unknown[] | null = null;

  const setInternalError = (targetField: Field, error: unknown): void => {
    const targetController = controller._controllerMap.get(targetField);
    if (
      targetController !== undefined &&
      targetController._initiator === controller &&
      controller._validationNonce === validationNonce
    ) {
      (errors ||= []).push(error);
      setError(targetController, error, true, notifyCallbacks);
    }
  };

  try {
    controller._validator.validate(controller._field, setInternalError, options);
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
function validateAsync(controller: FieldController, options: unknown): Promise<any[] | null> {
  const notifyCallbacks: Field['notify'][] = [];

  if (controller._initiator === controller) {
    endValidation(controller, controller, true, notifyCallbacks);
  }

  clearErrors(controller, true, notifyCallbacks);
  beginValidation(controller, controller, notifyCallbacks);

  controller._abortController = new AbortController();

  const abortSignal = controller._abortController.signal;
  const validationNonce = ++controller._validationNonce;

  callAll(notifyCallbacks);

  let errors: unknown[] | null = null;

  const setInternalError = (targetField: Field, error: unknown): void => {
    const targetController = controller._controllerMap.get(targetField);
    if (
      targetController !== undefined &&
      targetController._initiator === controller &&
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
      resolve(validateAsync(controller._field, setInternalError, options, abortSignal));
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
      try {
        callAll(endValidation(controller, controller, false, []));
      } catch {}
      throw error;
    }
  );
}
