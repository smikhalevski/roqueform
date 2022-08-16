import { Field, Plugin } from './Field';
import { isEqual, Writable } from './utils';

export interface ValidationPlugin<E> {
  readonly validating: boolean;

  readonly invalid: boolean;

  readonly error: E | null;

  setError(error: E): void;

  deleteError(): void;

  clearErrors(): void;

  validate(): Promise<void> | void;

  abortValidation(): void;
}

export type ValidateCallback<E> = (
  targetField: Field,
  setError: (field: Field, error: E) => void,
  signal: AbortSignal
) => Promise<void> | void;

export function validationPlugin<E>(validate: ValidateCallback<E>): Plugin<any, ValidationPlugin<E>> {
  const controllerMap = new WeakMap<Field, FieldController>();

  return field => {
    if (!controllerMap.has(field)) {
      enhanceField(field, validate, controllerMap);
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
  __validate: ValidateCallback<unknown>;

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

function enhanceField(
  field: Field,
  validate: ValidateCallback<unknown>,
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
    __validate: validate,
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
    validating: false,
    invalid: false,
    error: null,

    setValue() {
      if (controller.__validator !== null) {
        notifyControllers(unsetControllerValidator(controller, controller.__validator, []));
      }
      return setValue.call(this, arguments);
    },
    dispatchValue() {
      if (controller.__validator !== null) {
        notifyControllers(unsetControllerValidator(controller, controller.__validator, []));
      }
      return dispatchValue.call(this, arguments);
    },
    setError(error) {
      notifyControllers(setControllerError(controller, error, false, []));
    },
    deleteError() {
      notifyControllers(deleteControllerError(controller, false, []));
    },
    clearErrors() {
      notifyControllers(clearControllerErrors(controller, false, []));
    },
    validate() {
      return validateController(controller);
    },
    abortValidation() {
      if (controller.__validator !== null) {
        notifyControllers(unsetControllerValidator(controller.__validator, controller.__validator, []));
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
function setControllerError(
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
function deleteControllerError(
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
function clearControllerErrors(
  controller: FieldController,
  internal: boolean,
  dirtyControllers: FieldController[]
): FieldController[] {
  deleteControllerError(controller, internal, dirtyControllers);

  if (controller.__children === null) {
    return dirtyControllers;
  }
  for (const child of controller.__children) {
    if (internal && child.__field.transient) {
      continue;
    }
    clearControllerErrors(child, internal, dirtyControllers);
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
function setControllerValidator(
  controller: FieldController,
  validator: FieldController,
  dirtyControllers: FieldController[]
): FieldController[] {
  controller.__validator = validator;

  dirtyControllers.push(controller);

  if (controller.__children === null) {
    return dirtyControllers;
  }
  for (const child of controller.__children) {
    if (child.__field.transient) {
      continue;
    }
    setControllerValidator(child, validator, dirtyControllers);
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
function unsetControllerValidator(
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

  dirtyControllers.push(controller);

  if (controller.__children === null) {
    return dirtyControllers;
  }
  for (const child of controller.__children) {
    unsetControllerValidator(child, validator, dirtyControllers);
  }
  return dirtyControllers;
}

/**
 * @internal
 * Starts the controller validation process.
 *
 * @param controller The controller to validate.
 */
function validateController(controller: FieldController): Promise<void> | void {
  const dirtyControllers: FieldController[] = [];

  if (controller.__validator !== null) {
    // Abort pending validation
    unsetControllerValidator(controller.__validator, controller.__validator, dirtyControllers);
  }

  const pendingControllers: FieldController[] = [];
  const abortController = new AbortController();

  controller.__abortController = abortController;

  clearControllerErrors(controller, true, dirtyControllers);

  setControllerValidator(controller, controller, pendingControllers);

  const applyError = (targetField: Field, error: unknown): void => {
    const targetController = controller.__controllerMap.get(targetField);

    if (targetController === undefined || targetController.__validator !== controller) {
      return;
    }
    if (async) {
      notifyControllers(setControllerError(targetController, error, true, []));
    } else {
      setControllerError(targetController, error, true, dirtyControllers);
    }
  };

  let async = false;

  const result = controller.__validate(controller.__field, applyError, abortController.signal);

  if (result instanceof Promise) {
    async = true;

    const cleanup = () => {
      controller.__abortController = null;
      notifyControllers(unsetControllerValidator(controller, controller, []));
    };

    const promise = result.then(cleanup, error => {
      cleanup();
      throw error;
    });

    dirtyControllers.push(...pendingControllers);

    notifyControllers(dirtyControllers);

    return promise;
  }

  unsetControllerValidator(controller, controller, []);
  notifyControllers(dirtyControllers);
}

function notifyControllers(controllers: FieldController[]): void {
  for (let i = 0; i < controllers.length; ++i) {
    const controller = controllers[i];

    if (controllers.indexOf(controller, i + 1) === -1) {
      controller.__field.notify();
    }
  }
}
