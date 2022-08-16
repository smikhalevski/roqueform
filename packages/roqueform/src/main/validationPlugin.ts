import { Field, Plugin } from './Field';
import { isEqual, Writable } from './utils';

/**
 * The mixin added to fields by {@link validationPlugin}.
 *
 * @template E The error associated with the field.
 */
export interface ValidationPlugin<E> {
  /**
   * `true` if asynchronous validation is pending, or `false` otherwise.
   */
  readonly validating: boolean;

  /**
   * `true` if the field or any of its derived fields have an associated error, or `false` otherwise.
   */
  readonly invalid: boolean;

  /**
   * An error associated with this field, or `null` if there's no error.
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
   * Triggers field validation.
   */
  validate(): Promise<void> | void;

  /**
   * Aborts asynchronous validation.
   */
  abortValidation(): void;
}

/**
 * The callback that applies validation rules to a given field.
 *
 * @param targetField The field where {@link ValidationPlugin.validate} was called.
 * @param applyError Associates an error with the field.
 * @param signal The signal that is aborted is validation should be stopped.
 * @returns The promise that resolves when validation is completed, or `undefined` is validation is synchronous.
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
export function validationPlugin<E, T = unknown>(cb: ValidateCallback<E>): Plugin<T, ValidationPlugin<E>> {
  const controllerMap = new WeakMap<Field, FieldController>();

  return field => {
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
   * `true` if an error was set internally by {@link ValidationPlugin.validate}, or `false` if an issue was set by the
   * user through {@link ValidationPlugin.setError}.
   */
  __internal: boolean;
  __validateCallback: ValidateCallback<unknown>;

  /**
   * The controller that initiated the subtree validation, or `null` if there's no pending validation.
   */
  __validator: FieldController | null;

  /**
   * The abort controller that aborts the signal passed to {@link ValidateCallback}.
   */
  __abortController: AbortController | null;
  __controllerMap: WeakMap<Field, FieldController>;
}

/**
 * @internal
 */
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
    __validator: null,
    __abortController: null,
    __controllerMap: controllerMap,
  };

  controllerMap.set(field, controller);

  if (field.parent !== null) {
    const parent = controllerMap.get(field.parent) as FieldController;

    controller.__parent = parent;
    controller.__validator = parent.__validator;

    (parent.__children ||= []).push(controller);
  }

  const { setValue, dispatchValue } = field;

  Object.assign<Field, Partial<Field> & ValidationPlugin<unknown>>(field, {
    validating: controller.__validator !== null,
    invalid: false,
    error: null,

    setValue() {
      if (controller.__validator !== null) {
        notifyAll(unsetValidator(controller, controller.__validator, []));
      }
      return setValue.call(this, arguments);
    },
    dispatchValue() {
      if (controller.__validator !== null) {
        notifyAll(unsetValidator(controller, controller.__validator, []));
      }
      return dispatchValue.call(this, arguments);
    },
    setError(error) {
      notifyAll(setError(controller, error, false, []));
    },
    deleteError() {
      notifyAll(deleteError(controller, false, []));
    },
    clearErrors() {
      notifyAll(clearErrors(controller, false, []));
    },
    validate() {
      return applyValidation(controller);
    },
    abortValidation() {
      if (controller.__validator !== null) {
        notifyAll(unsetValidator(controller.__validator, controller.__validator, []));
      }
    },
  });
}

/**
 * @internal
 * Associates a validation error with the field.
 *
 * @param controller The controller for which an error is set.
 * @param error An error to set.
 * @param internal If `true` then an error is set internally (not during {@link ValidationPlugin.validate} call).
 * @param dirtyControllers The in-out set of controllers that were updated during the update propagation.
 * @returns The set of updated controllers.
 */
function setError(
  controller: FieldController,
  error: unknown,
  internal: boolean,
  dirtyControllers: FieldController[]
): FieldController[] {
  if (controller.__errored && isEqual(controller.__error, error) && controller.__internal === internal) {
    return dirtyControllers;
  }

  controller.__field.error = controller.__error = error;
  controller.__field.invalid = true;
  controller.__internal = internal;

  dirtyControllers.push(controller);

  if (controller.__errored) {
    return dirtyControllers;
  }

  controller.__errorCount++;
  controller.__errored = true;

  for (let parent = controller.__parent; parent !== null; parent = parent.__parent) {
    if (parent.__errorCount++ === 0) {
      parent.__field.invalid = true;
      dirtyControllers.push(parent);
    }
  }

  return dirtyControllers;
}

/**
 * @internal
 * Deletes a validation error from the field.
 *
 * @param controller The controller for which an error must be deleted.
 * @param internal If `true` then only errors set by {@link ValidationPlugin.validate} are deleted.
 * @param dirtyControllers The in-out set of controllers that were updated during the update propagation.
 * @returns The set of updated controllers.
 */
function deleteError(
  controller: FieldController,
  internal: boolean,
  dirtyControllers: FieldController[]
): FieldController[] {
  if (!controller.__errored || (internal && !controller.__internal)) {
    return dirtyControllers;
  }

  controller.__field.error = controller.__error = null;
  controller.__field.invalid = --controller.__errorCount !== 0;
  controller.__internal = controller.__errored = false;

  dirtyControllers.push(controller);

  for (let parent = controller.__parent; parent !== null && --parent.__errorCount === 0; parent = parent.__parent) {
    parent.__field.invalid = false;
    dirtyControllers.push(parent);
  }

  return dirtyControllers;
}

/**
 * @internal
 * Recursively deletes errors associated with the field and all of its derived fields.
 *
 * @param controller The controller tree root.
 * @param internal If `true` then only errors set by {@link ValidationPlugin.validate} are deleted.
 * @param dirtyControllers The in-out set of controllers that were updated during the update propagation.
 * @returns The set of updated controllers.
 */
function clearErrors(
  controller: FieldController,
  internal: boolean,
  dirtyControllers: FieldController[]
): FieldController[] {
  deleteError(controller, internal, dirtyControllers);

  if (controller.__children === null) {
    return dirtyControllers;
  }
  for (const child of controller.__children) {
    if (!internal || !child.__field.transient) {
      clearErrors(child, internal, dirtyControllers);
    }
  }
  return dirtyControllers;
}

/**
 * @internal
 * Assigns validator to the controller.
 *
 * @param controller The controller to which the validator must be assigned.
 * @param validator The controller that triggered the validation process.
 * @param dirtyControllers The in-out set of controllers that were updated during the update propagation.
 * @returns The set of updated controllers.
 */
function setValidator(
  controller: FieldController,
  validator: FieldController,
  dirtyControllers: FieldController[]
): FieldController[] {
  controller.__validator = validator;
  controller.__field.validating = true;

  dirtyControllers.push(controller);

  if (controller.__children === null) {
    return dirtyControllers;
  }
  for (const child of controller.__children) {
    if (!child.__field.transient) {
      setValidator(child, validator, dirtyControllers);
    }
  }
  return dirtyControllers;
}

/**
 * @internal
 * Removes validator from the controller.
 *
 * @param controller The controller that is being validated.
 * @param validator The validator that is manages the controller validation process.
 * @param dirtyControllers The in-out set of controllers that were updated during the update propagation.
 * @returns The set of updated controllers.
 */
function unsetValidator(
  controller: FieldController,
  validator: FieldController,
  dirtyControllers: FieldController[]
): FieldController[] {
  if (controller.__validator !== validator) {
    return dirtyControllers;
  }
  if (controller.__validator === controller) {
    controller.__abortController?.abort();
    controller.__abortController = null;
  }

  controller.__validator = null;
  controller.__field.validating = false;

  dirtyControllers.push(controller);

  if (controller.__children === null) {
    return dirtyControllers;
  }
  for (const child of controller.__children) {
    unsetValidator(child, validator, dirtyControllers);
  }
  return dirtyControllers;
}

/**
 * @internal
 * Starts the controller validation process.
 *
 * @param controller The controller to validate.
 */
function applyValidation(controller: FieldController): Promise<void> | void {
  const dirtyControllers: FieldController[] = [];

  if (controller.__validator !== null) {
    // Abort pending validation
    unsetValidator(controller.__validator, controller.__validator, dirtyControllers);
  }

  const pendingControllers: FieldController[] = [];
  const abortController = new AbortController();

  controller.__abortController = abortController;

  clearErrors(controller, true, dirtyControllers);
  setValidator(controller, controller, pendingControllers);

  let async = false;
  let result;

  const applyError = (targetField: Field, error: unknown): void => {
    const targetController = controller.__controllerMap.get(targetField);

    if (
      targetController === undefined ||
      targetController.__validator !== controller ||
      controller.__abortController !== abortController
    ) {
      return;
    }
    if (async) {
      notifyAll(setError(targetController, error, true, []));
    } else {
      setError(targetController, error, true, dirtyControllers);
    }
  };

  try {
    result = controller.__validateCallback(controller.__field, applyError, abortController.signal);
  } catch (error) {
    controller.__abortController = null;
    unsetValidator(controller, controller, []);
    notifyAll(dirtyControllers);
    throw error;
  }

  if (!(result instanceof Promise)) {
    controller.__abortController = null;
    unsetValidator(controller, controller, []);
    notifyAll(dirtyControllers);
    return;
  }

  async = true;

  const cleanUp = () => {
    controller.__abortController = null;
    notifyAll(unsetValidator(controller, controller, []));
  };

  const abortPromise = new Promise(resolve => {
    abortController.signal.addEventListener('abort', resolve);
  });

  const promise = Promise.race([result, abortPromise]).then(cleanUp, error => {
    cleanUp();
    throw error;
  });

  notifyAll(dirtyControllers.concat(pendingControllers));

  return promise;
}

/**
 * @internal
 * Notifies each controller from the array once.
 *
 * @param controllers Controllers to notify.
 */
function notifyAll(controllers: FieldController[]): void {
  for (let i = 0; i < controllers.length; ++i) {
    const controller = controllers[i];

    if (controllers.indexOf(controller, i + 1) === -1) {
      controller.__field.notify();
    }
  }
}
