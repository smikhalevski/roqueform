import { Field, Plugin } from './Field';
import { callAll, isEqual, Writable } from './utils';

/**
 * The enhancement added to fields by the {@linkcode validationPlugin}.
 *
 * @template E The error associated with the field.
 */
export interface ValidationPlugin<E> {
  /**
   * `true` if an asynchronous validation is pending, or `false` otherwise.
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
   * Triggers the field validation.
   */
  validate(): Promise<void> | void;

  /**
   * Aborts asynchronous validation or no-op if there's no pending validation.
   */
  abortValidation(): void;
}

/**
 * The callback that applies validation rules to a given field.
 *
 * @param targetField The field where {@linkcode ValidationPlugin.validate} was called.
 * @param applyError Associates an error with the field.
 * @param signal The signal that is aborted if the validation process should be stopped.
 * @returns The promise that resolves when validation is completed, or `undefined` if validation is synchronous.
 */
export type ValidateCallback<E> = (
  targetField: Field,
  applyError: (field: Field, error: E) => void,
  signal: AbortSignal
) => Promise<void> | void;

/**
 * Enhances the field with validation methods.
 *
 * @param cb The callback that applies validation rules to a provided field.
 * @template E The error associated with the field.
 * @returns The plugin.
 */
export function validationPlugin<T, E>(cb: ValidateCallback<E>): Plugin<T, ValidationPlugin<E>> {
  let controllerMap: WeakMap<Field, FieldController> | undefined;

  return field => {
    controllerMap ||= new WeakMap();

    if (!controllerMap.has(field)) {
      enhanceField(field, cb, controllerMap);
    }
  };
}

interface FieldController {
  __parent: FieldController | null;
  __children: FieldController[] | null;
  __field: Field & Writable<ValidationPlugin<unknown>>;

  /**
   * The total number of errors associated with the field and its children.
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
  __validateCallback: ValidateCallback<unknown>;

  /**
   * The controller that initiated the subtree validation, or `null` if there's no pending validation.
   */
  __initiator: FieldController | null;

  /**
   * The abort controller that aborts the signal passed to {@linkcode ValidateCallback}.
   */
  __abortController: AbortController | null;
  __controllerMap: WeakMap<Field, FieldController>;
}

function enhanceField(
  field: Field,
  cb: ValidateCallback<unknown>,
  controllerMap: WeakMap<Field, FieldController>
): void {
  const controller: FieldController = {
    __parent: null,
    __children: null,
    __field: field as Field & Writable<ValidationPlugin<unknown>>,
    __errorCount: 0,
    __errored: false,
    __error: null,
    __internal: false,
    __validateCallback: cb,
    __initiator: null,
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

  Object.assign<Field, Pick<Field, 'setTransientValue' | 'setValue'> & ValidationPlugin<unknown>>(field, {
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
    validate() {
      return validate(controller);
    },
    abortValidation() {
      if (controller.__initiator !== null) {
        callAll(endValidation(controller.__initiator, controller.__initiator, true, []));
      }
    },
  });
}

/**
 * Associates a validation error with the field.
 *
 * @param controller The controller for which an error is set.
 * @param error An error to set.
 * @param internal If `true` then an error is set internally (not during {@linkcode ValidationPlugin.validate} call).
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
 * @param internal If `true` then only errors set by {@linkcode ValidationPlugin.validate} are deleted.
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

  for (let parent = controller.__parent; parent !== null && --parent.__errorCount === 0; parent = parent.__parent) {
    parent.__field.invalid = false;
    notifyCallbacks.push(parent.__field.notify);
  }

  return notifyCallbacks;
}

/**
 * Recursively deletes errors associated with the field and all of its derived fields.
 *
 * @param controller The controller tree root.
 * @param internal If `true` then only errors set by {@linkcode ValidationPlugin.validate} are deleted.
 * @param notifyCallbacks The in-out array of callbacks that notify affected fields.
 * @returns An array of callbacks that notify affected fields.
 */
function clearErrors(
  controller: FieldController,
  internal: boolean,
  notifyCallbacks: Field['notify'][]
): Field['notify'][] {
  deleteError(controller, internal, notifyCallbacks);

  if (controller.__children === null) {
    return notifyCallbacks;
  }
  for (const child of controller.__children) {
    if (!internal || !child.__field.transient) {
      clearErrors(child, internal, notifyCallbacks);
    }
  }
  return notifyCallbacks;
}

/**
 * Assigns initiator to the controller and all of its children.
 *
 * Marks the controller as being validated.
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

  if (controller.__children === null) {
    return notifyCallbacks;
  }
  for (const child of controller.__children) {
    if (!child.__field.transient) {
      beginValidation(child, initiator, notifyCallbacks);
    }
  }
  return notifyCallbacks;
}

/**
 * Aborts the pending validation and removes initiator from the controller and all of its children.
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

  if (controller.__children === null) {
    return notifyCallbacks;
  }
  for (const child of controller.__children) {
    endValidation(child, initiator, aborted, notifyCallbacks);
  }
  return notifyCallbacks;
}

/**
 * Starts the controller validation process.
 *
 * @param controller The controller to validate.
 */
function validate(controller: FieldController): Promise<void> | void {
  const notifyCallbacks: Field['notify'][] = [];

  if (controller.__initiator !== null) {
    // Abort pending validation
    endValidation(controller.__initiator, controller.__initiator, true, notifyCallbacks);
  }

  const pendingNotifyCallbacks: Field['notify'][] = [];
  const abortController = new AbortController();

  controller.__abortController = abortController;

  // Clear errors that were set during the previous validation,
  // so errors set through `field.setError` are preserved.
  clearErrors(controller, true, notifyCallbacks);

  beginValidation(controller, controller, pendingNotifyCallbacks);

  let async = false;
  let result;

  const __setError = (targetField: Field, error: unknown): void => {
    const targetController = controller.__controllerMap.get(targetField);

    if (
      targetController === undefined ||
      targetController.__initiator !== controller ||
      controller.__abortController !== abortController
    ) {
      return;
    }
    if (async) {
      callAll(setError(targetController, error, true, []));
    } else {
      setError(targetController, error, true, notifyCallbacks);
    }
  };

  try {
    result = controller.__validateCallback(controller.__field, __setError, abortController.signal);
  } catch (error) {
    controller.__abortController = null;
    endValidation(controller, controller, false, []);
    callAll(notifyCallbacks);
    throw error;
  }

  if (!(result instanceof Promise)) {
    controller.__abortController = null;
    endValidation(controller, controller, false, []);
    callAll(notifyCallbacks);
    return;
  }

  async = true;

  const cleanUp = () => {
    controller.__abortController = null;
    callAll(endValidation(controller, controller, false, []));
  };

  const abortPromise = new Promise(resolve => {
    abortController.signal.addEventListener('abort', resolve);
  });

  const promise = Promise.race([result, abortPromise]).then(cleanUp, error => {
    cleanUp();
    throw error;
  });

  callAll(notifyCallbacks.concat(pendingNotifyCallbacks));

  return promise;
}
