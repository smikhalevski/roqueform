import { Event, Field, PluginInjector, PluginOf, Subscriber, Unsubscribe } from './types';
import { dispatchEvents } from './utils';

const EVENT_CHANGE_ERRORS = 'change:errors';
const ERROR_ABORT = 'Validation aborted';

/**
 * The callback that returns the new array of errors that includes the given error, or returns the original errors
 * array if there are no changes.
 *
 * @param errors The array of current errors.
 * @param error The new error to add.
 * @returns The new array of errors that includes the given error.
 * @template Error The error.
 */
export type ValidationErrorsMerger<Error = any> = (errors: Error[], error: Error) => Error[];

/**
 * The pending validation descriptor.
 *
 * @template Plugin The plugin injected into the field.
 */
export interface Validation<Plugin = ValidationPlugin> {
  /**
   * The field where the validation was triggered.
   */
  rootField: Field<Plugin>;

  /**
   * The abort controller associated with the pending {@link Validator.validateAsync async validation}, or `null` if
   * the validation is synchronous.
   */
  abortController: AbortController | null;
}

/**
 * Options of the {@link ValidationPlugin.clearErrors} method.
 */
export interface ClearErrorsOptions {
  /**
   * If `true` then errors are deleted for this field and all of its descendant fields.
   *
   * @default false
   */
  recursive?: boolean;
}

/**
 * The plugin that enables a field value validation.
 *
 * @template Error The error.
 * @template Options Options passed to the validator.
 */
export interface ValidationPlugin<Error = any, Options = any> {
  /**
   * The array of errors associated with this field.
   */
  errors: Error[];

  /**
   * The callback that returns the new array of errors that includes the given error, or returns the original errors
   * array if there are no changes.
   *
   * Child field inherit the parent field error merger when being accessed for the first time.
   */
  errorsMerger: ValidationErrorsMerger<Error>;

  /**
   * `true` if this field has associated errors, or `false` otherwise.
   */
  readonly isInvalid: boolean;

  /**
   * `true` if the validation is pending, or `false` otherwise.
   */
  readonly isValidating: boolean;

  /**
   * The validator to which the field value validation is delegated.
   */
  validator: Validator;

  /**
   * The pending validation, or `null` if there's no pending validation.
   */
  validation: Validation<PluginOf<this>> | null;

  /**
   * Associates an error with the field.
   *
   * @param error The error to add.
   */
  addError(error: Error): void;

  /**
   * Deletes an error associated with this field. No-op if an error isn't associated with this field.
   *
   * @param error The error to delete.
   */
  deleteError(error: Error): void;

  /**
   * Deletes all errors associated with this field.
   */
  clearErrors(options?: ClearErrorsOptions): void;

  /**
   * Returns all fields that have associated errors.
   */
  getInvalidFields(): Field<PluginOf<this>>[];

  /**
   * Triggers a synchronous field validation. Starting a validation doesn't clear errors that were set during the
   * previous validation. If you want to clear all errors before the validation, use {@link clearErrors}.
   *
   * If this field is currently being validated then the validation {@link abortValidation is aborted} at current
   * {@link Validation.rootField validation root}.
   *
   * {@link Field.isTransient Transient} descendants of this field are excluded from validation.
   *
   * @param options Options passed to {@link Validator the validator}.
   * @returns `true` if this field or any of it descendants have an associated error, or `false` otherwise.
   */
  validate(options?: Options): boolean;

  /**
   * Triggers an asynchronous field validation. Starting a validation doesn't clear errors that were set during the
   * previous validation. If you want to clear all errors before the validation, use {@link clearErrors}.
   *
   * If this field is currently being validated then the validation {@link abortValidation is aborted} at current
   * {@link Validation.rootField validation root}.
   *
   * {@link Field.isTransient Transient} descendants of this field are excluded from validation.
   *
   * @param options Options passed to {@link Validator the validator}.
   * @returns `true` if this field or any of it descendants have an associated error, or `false` otherwise.
   */
  validateAsync(options?: Options): Promise<boolean>;

  /**
   * Aborts the async validation of {@link Validation.rootField the validation root field} associated with this field.
   * No-op if there's no pending validation.
   */
  abortValidation(): void;

  /**
   * Subscribes to {@link errors an associated error} changes.
   *
   * @param eventType The type of the event.
   * @param subscriber The subscriber that would be triggered.
   * @returns The callback to unsubscribe the subscriber.
   * @see {@link error}
   * @see {@link isInvalid}
   */
  on(eventType: 'change:errors', subscriber: Subscriber<PluginOf<this>, Error[]>): Unsubscribe;

  /**
   * Subscribes to the start of the validation. {@link Event.data} carries the validation that is going to start.
   *
   * @param eventType The type of the event.
   * @param subscriber The subscriber that would be triggered.
   * @returns The callback to unsubscribe the subscriber.
   * @see {@link validation}
   * @see {@link isValidating}
   */
  on(eventType: 'validation:start', subscriber: Subscriber<PluginOf<this>, Validation<PluginOf<this>>>): Unsubscribe;

  /**
   * Subscribes to the end of the validation. Check {@link isInvalid} to detect the actual validity status.
   * {@link Event.data} carries the validation that has ended.
   *
   * @param eventType The type of the event.
   * @param subscriber The subscriber that would be triggered.
   * @returns The callback to unsubscribe the subscriber.
   * @see {@link validation}
   * @see {@link isValidating}
   */
  on(eventType: 'validation:end', subscriber: Subscriber<PluginOf<this>, Validation<PluginOf<this>>>): Unsubscribe;
}

/**
 * The validator to which the field value validation is delegated.
 *
 * @template Error The error.
 * @template Options Options passed to the validator.
 */
export interface Validator<Error = any, Options = any> {
  /**
   * Applies validation rules to a field.
   *
   * Before {@link ValidationPlugin.addError adding an error} to the field, check that
   * {@link ValidationPlugin.validation the validation} didn't change.
   *
   * @param field The field where {@link ValidationPlugin.validate} was called.
   * @param options The options passed to the {@link ValidationPlugin.validate} method.
   */
  validate(field: Field<ValidationPlugin<Error, Options>>, options: Options | undefined): void;

  /**
   * Applies validation rules to a field. If this callback is omitted, then {@link Validator.validate} would be called
   * instead.
   *
   * Before {@link ValidationPlugin.addError adding an error} to the field, check that
   * {@link ValidationPlugin.validation the validation} didn't change, and
   * {@link Validation.abortController wasn't aborted}.
   *
   * @param field The field where {@link ValidationPlugin.validateAsync} was called.
   * @param options The options passed to the {@link ValidationPlugin.validateAsync} method.
   */
  validateAsync?(field: Field<ValidationPlugin<Error, Options>>, options: Options | undefined): Promise<void>;
}

export interface ValidationPluginOptions<Error = any, Options = any> {
  /**
   * The validator object or a callback that performs synchronous validation.
   */
  validator: Validator<Error, Options> | Validator<Error, Options>['validate'];

  /**
   * The callback that updates {@link ValidationPlugin.errors}. The default merger keeps errors unique.
   */
  errorsMerger?: ValidationErrorsMerger<Error>;
}

/**
 * Enhances the field with validation methods.
 *
 * This plugin is a scaffold for implementing validation. Check out
 * [library-based validation plugins](https://github.com/smikhalevski/roqueform#plugins-and-integrations) before
 * picking this plugin.
 *
 * @template Error The error.
 * @template Options Options passed to the validator.
 * @template Value The root field value.
 */
export function validationPlugin<Error = any, Options = void>(
  options: ValidationPluginOptions<Error, Options>
): PluginInjector<ValidationPlugin<Error, Options>> {
  const errorsMerger = options.errorsMerger || naturalErrorsMerger;

  const validator = typeof options.validator === 'function' ? { validate: options.validator } : options.validator;

  return field => {
    const { parentField } = field;

    field.errors = [];
    field.errorsMerger = errorsMerger;
    field.validator = validator;
    field.validation = null;

    if (parentField !== null) {
      field.errorsMerger = parentField.errorsMerger;
      field.validation = parentField.validation;
    }

    Object.defineProperties(field, {
      isInvalid: { configurable: true, get: () => field.errors.length !== 0 },
      isValidating: { configurable: true, get: () => field.validation !== null },
    });

    field.addError = error => {
      const prevErrors = field.errors;
      const nextErrors = field.errorsMerger(prevErrors, error);

      if (prevErrors !== nextErrors) {
        field.errors = nextErrors;

        dispatchEvents([{ type: EVENT_CHANGE_ERRORS, targetField: field, originField: field, data: prevErrors }]);
      }
    };

    field.deleteError = error => {
      const prevErrors = field.errors;
      const errorIndex = prevErrors.indexOf(error);

      if (errorIndex !== -1) {
        const nextErrors = prevErrors.slice(0);
        nextErrors.splice(errorIndex, 1);
        field.errors = nextErrors;

        dispatchEvents([{ type: EVENT_CHANGE_ERRORS, targetField: field, originField: field, data: prevErrors }]);
      }
    };

    field.clearErrors = options => {
      dispatchEvents(clearErrors(field, options, []));
    };

    field.getInvalidFields = () => getInvalidFields(field, []);

    field.validate = options => validate(field, options);

    field.validateAsync = options => validateAsync(field, options);

    field.abortValidation = () => {
      dispatchEvents(abortValidation(field, []));
    };
  };
}

const naturalErrorsMerger: ValidationErrorsMerger = (errors, error) => {
  if (!errors.includes(error)) {
    errors = errors.slice(0);
    errors.push(error);
  }
  return errors;
};

function clearErrors(
  field: Field<ValidationPlugin>,
  options: ClearErrorsOptions | undefined,
  events: Event[]
): Event[] {
  const prevErrors = field.errors;

  if (prevErrors.length !== 0) {
    field.errors = [];
    events.push({ type: EVENT_CHANGE_ERRORS, targetField: field, originField: field, data: prevErrors });
  }
  if (field.children !== null && options !== undefined && options.recursive) {
    for (const child of field.children) {
      clearErrors(child, options, events);
    }
  }
  return events;
}

function hasErrors(field: Field<ValidationPlugin>): boolean {
  if (field.errors.length !== 0) {
    return true;
  }
  if (field.children !== null) {
    for (const child of field.children) {
      if (hasErrors(child)) {
        return true;
      }
    }
  }
  return false;
}

function getInvalidFields(field: Field<ValidationPlugin>, batch: Field<ValidationPlugin>[]): Field<ValidationPlugin>[] {
  if (field.errors.length !== 0) {
    batch.push(field);
  }
  if (field.children !== null) {
    for (const child of field.children) {
      getInvalidFields(child, batch);
    }
  }
  return batch;
}

function startValidation(field: Field<ValidationPlugin>, validation: Validation, events: Event[]): Event[] {
  field.validation = validation;

  events.push({ type: 'validation:start', targetField: field, originField: validation.rootField, data: validation });

  if (field.children !== null) {
    for (const child of field.children) {
      if (!child.isTransient) {
        startValidation(child, validation, events);
      }
    }
  }
  return events;
}

function endValidation(field: Field<ValidationPlugin>, validation: Validation, events: Event[]): Event[] {
  if (field.validation !== validation) {
    return events;
  }

  field.validation = null;

  events.push({ type: 'validation:end', targetField: field, originField: validation.rootField, data: validation });

  if (field.children !== null) {
    for (const child of field.children) {
      endValidation(child, validation, events);
    }
  }
  return events;
}

function abortValidation(field: Field<ValidationPlugin>, events: Event[]): Event[] {
  const { validation } = field;

  if (validation !== null) {
    endValidation(validation.rootField, validation, events);
    validation.abortController?.abort();
  }
  return events;
}

function validate(field: Field<ValidationPlugin>, options: unknown): boolean {
  dispatchEvents(abortValidation(field, []));

  if (field.validation !== null) {
    throw new Error(ERROR_ABORT);
  }

  const validation: Validation = { rootField: field, abortController: null };

  try {
    dispatchEvents(startValidation(field, validation, []));
  } catch (error) {
    dispatchEvents(endValidation(field, validation, []));
    throw error;
  }

  if (field.validation !== validation) {
    throw new Error(ERROR_ABORT);
  }

  try {
    field.validator.validate(field, options);
  } catch (error) {
    dispatchEvents(endValidation(field, validation, []));
    throw error;
  }

  if (field.validation !== validation) {
    throw new Error(ERROR_ABORT);
  }
  dispatchEvents(endValidation(field, validation, []));
  return !hasErrors(field);
}

function validateAsync(field: Field<ValidationPlugin>, options: unknown): Promise<boolean> {
  return new Promise((resolve, reject) => {
    dispatchEvents(abortValidation(field, []));

    if (field.validation !== null) {
      reject(new Error(ERROR_ABORT));
      return;
    }

    const validation: Validation = { rootField: field, abortController: new AbortController() };

    try {
      dispatchEvents(startValidation(field, validation, []));
    } catch (error) {
      dispatchEvents(endValidation(field, validation, []));
      reject(error);
      return;
    }

    if ((field.validation as Validation | null) !== validation || validation.abortController === null) {
      reject(new Error(ERROR_ABORT));
      return;
    }

    const { validate, validateAsync = validate } = field.validator;

    validation.abortController.signal.addEventListener('abort', () => {
      reject(new Error(ERROR_ABORT));
    });

    Promise.resolve(validateAsync(field, options)).then(
      () => {
        if (field.validation !== validation) {
          reject(new Error(ERROR_ABORT));
        } else {
          dispatchEvents(endValidation(field, validation, []));
          resolve(!hasErrors(field));
        }
      },
      error => {
        dispatchEvents(endValidation(field, validation, []));
        reject(error);
      }
    );
  });
}
