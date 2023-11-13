import { Event, Field, PluginInjector, PluginOf, Subscriber, Unsubscribe } from './typings';
import { dispatchEvents, isEqual } from './utils';

const EVENT_CHANGE_ERROR = 'change:error';
const ERROR_ABORT = 'Validation aborted';

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
 * @template Error The validation error.
 * @template Options Options passed to the validator.
 */
export interface ValidationPlugin<Error = any, Options = any> {
  /**
   * A validation error associated with the field, or `null` if there's no error.
   */
  error: Error | null;

  /**
   * `true` if this field or any of its descendants have associated errors, or `false` otherwise.
   */
  readonly isInvalid: boolean;

  /**
   * `true` if an async validation is pending, or `false` otherwise.
   */
  readonly isValidating: boolean;

  /**
   * The total number of errors associated with this field and its child fields.
   *
   * @protected
   */
  ['errorCount']: number;

  /**
   * The origin of the associated error:
   * - 0 if there's no associated error.
   * - 1 if an error was set using {@link ValidationPlugin.setValidationError};
   * - 2 if an error was set using {@link ValidationPlugin.setError};
   *
   * @protected
   */
  ['errorOrigin']: 0 | 1 | 2;

  /**
   * The validator to which the field value validation is delegated.
   *
   * @protected
   */
  ['validator']: Validator;

  /**
   * The pending validation, or `null` if there's no pending validation.
   *
   * @protected
   */
  ['validation']: Validation<PluginOf<this>> | null;

  /**
   * Associates an error with the field and notifies the subscribers.
   *
   * @param error The error to set. If `null` or `undefined` then an error is deleted.
   */
  setError(error: Error | null | undefined): void;

  /**
   * Deletes an error associated with this field.
   */
  deleteError(): void;

  /**
   * Recursively deletes errors associated with this field and all of its child fields.
   */
  clearErrors(): void;

  /**
   * Returns all errors associated with this field and its child fields.
   */
  getErrors(): Error[];

  /**
   * Returns all fields that have an error.
   */
  getInvalidFields(): Field<PluginOf<this>>[];

  /**
   * Triggers a sync field validation. Starting a validation will clear errors that were set during the previous
   * validation and preserve errors set via {@link setError}. If you want to clear all errors before the validation,
   * use {@link clearErrors}.
   *
   * @param options Options passed to {@link Validator the validator}.
   * @returns `true` if {@link isInvalid field is valid}, or `false` otherwise.
   */
  validate(options?: Options): boolean;

  /**
   * Triggers an async field validation. Starting a validation will clear errors that were set during the previous
   * validation and preserve errors set via {@link setError}. If you want to clear all errors before the validation,
   * use {@link clearErrors}.
   *
   * @param options Options passed to {@link Validator the validator}.
   * @returns `true` if {@link isInvalid field is valid}, or `false` otherwise.
   */
  validateAsync(options?: Options): Promise<boolean>;

  /**
   * Aborts async validation of the field or no-op if there's no pending validation. If the field's parent is being
   * validated then parent validation proceeds but this field won't be updated with validation errors.
   */
  abortValidation(): void;

  /**
   * Subscribes to {@link error an associated error} changes. {@link Event.data} contains the previous error.
   *
   * @param eventType The type of the event.
   * @param subscriber The subscriber that would be triggered.
   * @returns The callback to unsubscribe the subscriber.
   * @see {@link error}
   * @see {@link isInvalid}
   */
  on(eventType: 'change:error', subscriber: Subscriber<PluginOf<this>, Error | null>): Unsubscribe;

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

  /**
   * Associates a validation error with the field and notifies the subscribers. Use this method in
   * {@link Validator validators} to set errors that can be overridden during the next validation.
   *
   * @param validation The validation in scope of which an error must be set.
   * @param error The error to set.
   * @protected
   */
  ['setValidationError'](validation: Validation<PluginOf<this>>, error: Error): void;
}

/**
 * The validator implements the validation rules.
 *
 * @template Error The validation error.
 * @template Options Options passed to the validator.
 */
export interface Validator<Error = any, Options = any> {
  /**
   * Applies validation rules to a field.
   *
   * Set {@link ValidationPlugin.setValidationError validation errors} to invalid fields during validation.
   *
   * @param field The field where {@link ValidationPlugin.validate} was called.
   * @param options The options passed to the {@link ValidationPlugin.validate} method.
   */
  validate(field: Field<ValidationPlugin<Error, Options>>, options: Options | undefined): void;

  /**
   * Applies validation rules to a field. If this callback is omitted, then {@link validate} would be called instead.
   *
   * Set {@link ValidationPlugin.setValidationError validation errors} to invalid fields during validation. Refer to
   * {@link ValidationPlugin.validation} to check that validation wasn't aborted.
   *
   * @param field The field where {@link ValidationPlugin.validateAsync} was called.
   * @param options The options passed to the {@link ValidationPlugin.validateAsync} method.
   */
  validateAsync?(field: Field<ValidationPlugin<Error, Options>>, options: Options | undefined): Promise<void>;
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
export function validationPlugin<Error = any, Options = void>(
  validator: Validator<Error, Options> | Validator<Error, Options>['validate']
): PluginInjector<ValidationPlugin<Error, Options>> {
  return field => {
    field.error = null;
    field.errorCount = 0;
    field.errorOrigin = 0;
    field.validator = typeof validator === 'function' ? { validate: validator } : validator;
    field.validation = field.parent !== null ? field.parent.validation : null;

    Object.defineProperties(field, {
      isInvalid: { configurable: true, get: () => field.errorCount !== 0 },
      isValidating: { configurable: true, get: () => field.validation !== null },
    });

    const { setValue, setTransientValue } = field;

    field.setValue = value => {
      if (field.validation !== null) {
        dispatchEvents(abortValidation(field, []));
      }
      setValue(value);
    };

    field.setTransientValue = value => {
      if (field.validation !== null) {
        dispatchEvents(
          field.validation.root === field ? abortValidation(field, []) : endValidation(field, field.validation, [])
        );
      }
      setTransientValue(value);
    };

    field.setError = error => {
      dispatchEvents(setError(field, error, 2, []));
    };

    field.deleteError = () => {
      dispatchEvents(deleteError(field, 2, []));
    };

    field.clearErrors = () => {
      dispatchEvents(clearErrors(field, 2, []));
    };

    field.getErrors = () => convertToErrors(getInvalidFields(field, []));

    field.getInvalidFields = () => getInvalidFields(field, []);

    field.validate = options => validate(field, options);

    field.validateAsync = options => validateAsync(field, options);

    field.abortValidation = () => {
      dispatchEvents(abortValidation(field, []));
    };

    field.setValidationError = (validation, error) => {
      if (validation !== null && field.validation === validation && field.errorOrigin < 2) {
        dispatchEvents(setError(field, error, 1, []));
      }
    };
  };
}

function setError(field: Field<ValidationPlugin>, error: unknown, errorOrigin: 1 | 2, events: Event[]): Event[] {
  if (error === null || error === undefined) {
    return deleteError(field, errorOrigin, events);
  }

  const originalError = field.error;

  if (originalError !== null && isEqual(originalError, error) && field.errorOrigin === errorOrigin) {
    return events;
  }

  field.error = error;
  field.errorOrigin = errorOrigin;

  events.push({ type: EVENT_CHANGE_ERROR, target: field, origin: field, data: originalError });

  if (originalError !== null) {
    return events;
  }

  field.errorCount++;

  for (let ancestor = field.parent; ancestor !== null; ancestor = ancestor.parent) {
    ancestor.errorCount++;
  }
  return events;
}

function deleteError(field: Field<ValidationPlugin>, errorOrigin: 1 | 2, events: Event[]): Event[] {
  const originalError = field.error;

  if (originalError === null || field.errorOrigin > errorOrigin) {
    return events;
  }

  field.error = null;
  field.errorOrigin = 0;
  field.errorCount--;

  events.push({ type: EVENT_CHANGE_ERROR, target: field, origin: field, data: originalError });

  for (let ancestor = field.parent; ancestor !== null; ancestor = ancestor.parent) {
    ancestor.errorCount--;
  }
  return events;
}

function clearErrors(field: Field<ValidationPlugin>, errorOrigin: 1 | 2, events: Event[]): Event[] {
  deleteError(field, errorOrigin, events);

  if (field.children !== null) {
    for (const child of field.children) {
      if (errorOrigin === 1 && child.isTransient) {
        continue;
      }
      clearErrors(child, errorOrigin, events);
    }
  }
  return events;
}

function startValidation(field: Field<ValidationPlugin>, validation: Validation, events: Event[]): Event[] {
  field.validation = validation;

  events.push({ type: 'validation:start', target: field, origin: validation.root, data: validation });

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

  events.push({ type: 'validation:end', target: field, origin: validation.root, data: validation });

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

function getInvalidFields(field: Field<ValidationPlugin>, batch: Field<ValidationPlugin>[]): Field<ValidationPlugin>[] {
  if (field.error !== null) {
    batch.push(field);
  }
  if (field.children !== null) {
    for (const child of field.children) {
      getInvalidFields(child, batch);
    }
  }
  return batch;
}

function convertToErrors(batch: Field<ValidationPlugin>[]): any[] {
  for (let i = 0; i < batch.length; ++i) {
    batch[i] = batch[i].error;
  }
  return batch;
}

function validate(field: Field<ValidationPlugin>, options: unknown): boolean {
  dispatchEvents(clearErrors(field, 1, abortValidation(field, [])));

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
  return field.errorCount === 0;
}

function validateAsync(field: Field<ValidationPlugin>, options: unknown): Promise<boolean> {
  return new Promise((resolve, reject) => {
    dispatchEvents(clearErrors(field, 1, abortValidation(field, [])));

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
          return field.errorCount === 0;
        },
        error => {
          dispatchEvents(endValidation(field, validation, []));
          throw error;
        }
      )
    );
  });
}
