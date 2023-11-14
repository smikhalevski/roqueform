import { Event, Field, PluginInjector, PluginOf, Subscriber, Unsubscribe } from './typings';
import { dispatchEvents } from './utils';

const EVENT_CHANGE_ERRORS = 'change:errors';
const ERROR_ABORT = 'Validation aborted';

const naturalErrorsMerger: ValidationErrorsMerger = (errors, error) =>
  errors.includes(error) ? errors : errors.concat([error]);

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
  root: Field<Plugin>;

  /**
   * The abort controller associated with the pending {@link Validator.validateAsync async validation}, or `null` if
   * the validation is synchronous.
   */
  abortController: AbortController | null;
}

/**
 * The plugin that enables field value validation.
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
   */
  errorsMerger: ValidationErrorsMerger<Error>;

  /**
   * `true` if this field or any of its descendants have associated errors, or `false` otherwise.
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
  addError(error: Error): this;

  /**
   * Deletes an error associated with this field.
   *
   * @param error The error to delete.
   */
  deleteError(error: Error): this;

  /**
   * Replaces errors associated with this field with the new array of errors.
   *
   * @param errors The array of new errors to set.
   */
  setErrors(errors: Error[]): this;

  /**
   * Deletes errors associated with this field.
   */
  clearErrors(): this;

  /**
   * Returns all errors associated with this field and its child fields.
   */
  getAllErrors(): Error[];

  /**
   * Recursively deletes errors associated with this field and all of its child fields.
   *
   * @param predicate The callback that returns truthy value if an error must be deleted. If omitted then all errors are
   * deleted.
   */
  clearAllErrors(predicate?: (error: Error) => any): this;

  /**
   * Returns all fields that have associated errors.
   */
  getInvalidFields(): Field<PluginOf<this>>[];

  /**
   * Triggers a synchronous field validation. Starting a validation doesn't clear errors that were set during the
   * previous validation. If you want to clear all errors before the validation, use {@link clearAllErrors}.
   *
   * @param options Options passed to {@link Validator the validator}.
   * @returns `true` if {@link isInvalid field is valid}, or `false` otherwise.
   */
  validate(options?: Options): boolean;

  /**
   * Triggers an asynchronous field validation. Starting a validation doesn't clear errors that were set during the
   * previous validation. If you want to clear all errors before the validation, use {@link clearAllErrors}.
   *
   * @param options Options passed to {@link Validator the validator}.
   * @returns `true` if {@link isInvalid field is valid}, or `false` otherwise.
   */
  validateAsync(options?: Options): Promise<boolean>;

  /**
   * Aborts the async validation of the field, or no-op if there's no pending validation. If the field participates in
   * pending ancestor field validation then parent validation is aborted.
   */
  abortValidation(): void;

  /**
   * Subscribes to {@link errors an associated error} changes. {@link Event.data} contains the previous error.
   *
   * @param eventType The type of the event.
   * @param subscriber The subscriber that would be triggered.
   * @returns The callback to unsubscribe the subscriber.
   * @see {@link error}
   * @see {@link isInvalid}
   */
  on(eventType: 'change:errors', subscriber: Subscriber<PluginOf<this>, Error | null>): Unsubscribe;

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
 * The validator implements the validation rules.
 *
 * @template Error The error.
 * @template Options Options passed to the validator.
 */
export interface Validator<Error = any, Options = any> {
  /**
   * Applies validation rules to a field.
   *
   * @param field The field where {@link ValidationPlugin.validate} was called.
   * @param options The options passed to the {@link ValidationPlugin.validate} method.
   */
  validate(field: Field<ValidationPlugin<Error, Options>>, options: Options | undefined): void;

  /**
   * Applies validation rules to a field. If this callback is omitted, then {@link validate} would be called instead.
   *
   * Refer to {@link ValidationPlugin.validation} to check that validation wasn't aborted.
   *
   * @param field The field where {@link ValidationPlugin.validateAsync} was called.
   * @param options The options passed to the {@link ValidationPlugin.validateAsync} method.
   */
  validateAsync?(field: Field<ValidationPlugin<Error, Options>>, options: Options | undefined): Promise<void>;
}

export interface ValidationPluginOptions<Error = any, Options = any> {
  /**
   * The callback or an object with `validate` and optional `validateAsync` methods that applies
   * validation rules to a provided field.
   */
  validator: Validator<Error, Options> | Validator<Error, Options>['validate'];

  /**
   * The callback that updates {@link errors}. If omitted then identity based merging is used.
   */
  errorsMerger: ValidationErrorsMerger<Error>;
}

/**
 * Enhances the field with validation methods.
 *
 * This plugin is a scaffold for implementing validation. If you don't know how to validate your fields then it is
 * highly likely that this is not the plugin you're looking for. Have a look at
 * [library-based validation plugins](https://github.com/smikhalevski/roqueform#plugins-and-integrations) instead.
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
    field.errors = [];
    field.errorsMerger = errorsMerger;
    field.validator = validator;
    field.validation = null;

    Object.defineProperties(field, {
      isInvalid: { configurable: true, get: () => getIsInvalid(field) },
      isValidating: { configurable: true, get: () => field.validation !== null },
    });

    field.addError = error => {
      const prevErrors = field.errors;
      const nextErrors = field.errorsMerger(prevErrors, error);
      if (prevErrors !== nextErrors) {
        field.errors = nextErrors;
        dispatchEvents([{ type: EVENT_CHANGE_ERRORS, targetField: field, originField: field, data: prevErrors }]);
      }
      return field;
    };

    field.deleteError = error => {
      const prevErrors = field.errors;
      const index = prevErrors.indexOf(error);
      if (index !== -1) {
        field.errors = prevErrors.slice(0, index).concat(prevErrors.slice(index + 1));
        dispatchEvents([{ type: EVENT_CHANGE_ERRORS, targetField: field, originField: field, data: prevErrors }]);
      }
      return field;
    };

    field.setErrors = errors => {
      const prevErrors = field.errors;

      let nextErrors: Error[] = [];
      for (const error of errors) {
        nextErrors = field.errorsMerger(nextErrors, error);
      }
      field.errors = nextErrors;
      dispatchEvents([{ type: EVENT_CHANGE_ERRORS, targetField: field, originField: field, data: prevErrors }]);
      return field;
    };

    field.clearErrors = () => {
      dispatchEvents(clearErrors(field, undefined, []));
      return field;
    };

    field.getAllErrors = () => getAllErrors(field, []);

    field.clearAllErrors = predicate => {
      dispatchEvents(clearAllErrors(field, predicate, []));
      return field;
    };

    field.getInvalidFields = () => getInvalidFields(field, []);

    field.validate = options => validate(field, options);

    field.validateAsync = options => validateAsync(field, options);

    field.abortValidation = () => {
      dispatchEvents(abortValidation(field, []));
    };
  };
}

function getIsInvalid(field: Field<ValidationPlugin>): boolean {
  if (field.errors.length !== 0) {
    return true;
  }
  if (field.children !== null) {
    for (const child of field.children) {
      if (getIsInvalid(child)) {
        return true;
      }
    }
  }
  return false;
}

function clearErrors(
  field: Field<ValidationPlugin>,
  predicate: ((error: any) => any) | undefined,
  events: Event[]
): Event[] {
  const prevErrors = field.errors;

  if (prevErrors.length !== 0) {
    let nextErrors: any[] | undefined;

    if (typeof predicate === 'function') {
      for (const error of prevErrors) {
        if (!predicate(error)) {
          (nextErrors ||= []).push(error);
        }
      }
    } else {
      nextErrors = [];
    }
    if (nextErrors !== undefined) {
      field.errors = nextErrors;
      events.push({ type: EVENT_CHANGE_ERRORS, targetField: field, originField: field, data: prevErrors });
    }
  }
  return events;
}

function clearAllErrors(
  field: Field<ValidationPlugin>,
  predicate: ((error: any) => any) | undefined,
  events: Event[]
): Event[] {
  clearErrors(field, predicate, events);

  if (field.children !== null) {
    for (const child of field.children) {
      clearAllErrors(child, predicate, events);
    }
  }
  return events;
}

function getAllErrors(field: Field<ValidationPlugin>, errors: any[]): any[] {
  if (field.errors.length !== 0) {
    errors.push(...field.errors);
  }
  if (field.children !== null) {
    for (const child of field.children) {
      getInvalidFields(child, errors);
    }
  }
  return errors;
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

  events.push({ type: 'validation:start', targetField: field, originField: validation.root, data: validation });

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

  events.push({ type: 'validation:end', targetField: field, originField: validation.root, data: validation });

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
    endValidation(validation.root, validation, events);
    validation.abortController?.abort();
  }
  return events;
}

function validate(field: Field<ValidationPlugin>, options: unknown): boolean {
  dispatchEvents(abortValidation(field, []));

  if (field.validation !== null) {
    throw new Error(ERROR_ABORT);
  }

  const validation: Validation = { root: field, abortController: null };

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
  return field.isInvalid;
}

function validateAsync(field: Field<ValidationPlugin>, options: unknown): Promise<boolean> {
  return new Promise((resolve, reject) => {
    if (field.validation !== null) {
      reject(new Error(ERROR_ABORT));
      return;
    }

    const validation: Validation = { root: field, abortController: new AbortController() };

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

    resolve(
      Promise.resolve(validateAsync(field, options)).then(
        () => {
          if (field.validation !== validation) {
            throw new Error(ERROR_ABORT);
          }
          dispatchEvents(endValidation(field, validation, []));
          return field.isInvalid;
        },
        error => {
          dispatchEvents(endValidation(field, validation, []));
          throw error;
        }
      )
    );
  });
}
