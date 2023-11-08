import { FieldEvent, Field, PluginCallback } from './typings';
import { dispatchEvents, isEqual } from './utils';

const EVENT_CHANGE = 'validityChange';
const EVENT_START = 'validationStart';
const EVENT_END = 'validationEnd';
const ERROR_ABORT = 'Validation aborted';

/**
 * Describes the pending validation.
 */
export interface Validation<Plugin = ValidationPlugin> {
  /**
   * The field where the validation was triggered.
   */
  readonly root: Field<Plugin>;

  /**
   * The abort controller associated with the pending {@link Validator.validateAsync async validation}, or `null` if
   * the validation is synchronous.
   */
  readonly abortController: AbortController | null;
}

/**
 * The plugin that enables field value validation.
 *
 * @template Error The validation error.
 * @template Options Options passed to the validator.
 */
export interface ValidationPlugin<Error = any, Options = any> {
  /**
   * @internal
   */
  ['__plugin']: unknown;

  /**
   * @internal
   */
  value: unknown;

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
   * The origin of the associated error:
   * - 0 if there's no associated error.
   * - 1 if an error was set using {@link ValidationPlugin.setValidationError};
   * - 2 if an error was set using {@link ValidationPlugin.setError};
   */
  ['errorOrigin']: 0 | 1 | 2;

  /**
   * The validator to which the field value validation is delegated.
   */
  ['validator']: Validator;

  /**
   * The pending validation, or `null` if there's no pending validation.
   */
  ['validation']: Validation<this['__plugin']> | null;

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
   * Recursively deletes errors associated with this field and all of its derived fields.
   */
  clearErrors(): void;

  /**
   * Returns all errors associated with this field and its child fields.
   */
  getErrors(): Error[];

  /**
   * Returns all fields that have an error.
   */
  getInvalidFields(): Field<this['__plugin']>[];

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
   * Subscribes the listener field validity change events. An {@link error} would contain the associated error.
   *
   * @param eventType The type of the event.
   * @param listener The listener that would be triggered.
   * @returns The callback to unsubscribe the listener.
   */
  on(eventType: 'validityChange', listener: (event: FieldEvent<this['value'], this['__plugin']>) => void): () => void;

  /**
   * Subscribes the listener to validation start events. The event is triggered for all fields that are going to be
   * validated. The {@link FieldController.value current value} of the field is the one that is being validated.
   * {@link FieldEvent.target} points to the field where validation was triggered.
   *
   * @param eventType The type of the event.
   * @param listener The listener that would be triggered.
   * @returns The callback to unsubscribe the listener.
   */
  on(eventType: 'validationStart', listener: (event: FieldEvent<this['value'], this['__plugin']>) => void): () => void;

  /**
   * Subscribes the listener to validation start end events. The event is triggered for all fields that were validated.
   * {@link FieldEvent.target} points to the field where validation was triggered. Check {@link isInvalid} to detect the
   * actual validity status.
   *
   * @param eventType The type of the event.
   * @param listener The listener that would be triggered.
   * @returns The callback to unsubscribe the listener.
   */
  on(eventType: 'validationEnd', listener: (event: FieldEvent<this['value'], this['__plugin']>) => void): () => void;

  /**
   * Associates a validation error with the field and notifies the subscribers. Use this method in
   * {@link Validator validators} to set errors that can be overridden during the next validation.
   *
   * @param validation The validation in scope of which the value is set.
   * @param error The error to set.
   */
  ['setValidationError'](validation: Validation<this['__plugin']>, error: Error): void;
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
   * Applies validation rules to a field.
   *
   * Check that {@link Validation.abortController validation isn't aborted} before
   * {@link ValidationPlugin.setValidationError setting a validation error}, otherwise stop validation as soon as
   * possible.
   *
   * If this callback is omitted, then {@link validate} would be called instead.
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
): PluginCallback<ValidationPlugin<Error, Options>> {
  return field => {
    field.error = null;
    field.errorCount = 0;
    field.errorOrigin = 0;
    field.validator = typeof validator === 'function' ? { validate: validator } : validator;
    field.validation = null;

    Object.defineProperties(field, {
      isInvalid: { get: () => field.errorCount !== 0 },
      isValidating: { get: () => field.validation !== null },
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
      if (validation !== null && field.validation !== validation && field.errorOrigin < 2) {
        dispatchEvents(setError(field, error, 1, []));
      }
    };
  };
}

type ValidationEvent = FieldEvent<ValidationPlugin>;

function setError(
  field: Field<ValidationPlugin>,
  error: unknown,
  errorOrigin: 1 | 2,
  events: ValidationEvent[]
): ValidationEvent[] {
  if (error === null || error === undefined) {
    return deleteError(field, errorOrigin, events);
  }

  const errored = field.error !== null;

  if (errored && isEqual(field.error, error) && field.errorOrigin === errorOrigin) {
    return events;
  }

  field.error = error;
  field.errorOrigin = errorOrigin;

  events.push({ type: EVENT_CHANGE, target: field, currentTarget: field });

  if (errored) {
    return events;
  }

  field.errorCount++;

  for (let ancestor = field.parent; ancestor !== null; ancestor = ancestor.parent) {
    if (ancestor.errorCount++ === 0) {
      events.push({ type: EVENT_CHANGE, target: field, currentTarget: ancestor });
    }
  }

  return events;
}

function deleteError(field: Field<ValidationPlugin>, errorOrigin: 1 | 2, events: ValidationEvent[]): ValidationEvent[] {
  if (field.error === null || field.errorOrigin > errorOrigin) {
    return events;
  }

  field.error = null;
  field.errorOrigin = 0;
  field.errorCount--;

  events.push({ type: EVENT_CHANGE, target: field, currentTarget: field });

  for (let ancestor = field.parent; ancestor !== null; ancestor = ancestor.parent) {
    if (--ancestor.errorCount === 0) {
      events.push({ type: EVENT_CHANGE, target: field, currentTarget: ancestor });
    }
  }

  return events;
}

function clearErrors(field: Field<ValidationPlugin>, errorOrigin: 1 | 2, events: ValidationEvent[]): ValidationEvent[] {
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

function startValidation(
  field: Field<ValidationPlugin>,
  validation: Validation,
  events: ValidationEvent[]
): ValidationEvent[] {
  field.validation = validation;

  events.push({ type: EVENT_START, target: validation.root, currentTarget: field });

  if (field.children !== null) {
    for (const child of field.children) {
      if (!child.isTransient) {
        startValidation(child, validation, events);
      }
    }
  }
  return events;
}

function endValidation(
  field: Field<ValidationPlugin>,
  validation: Validation,
  events: ValidationEvent[]
): ValidationEvent[] {
  if (field.validation !== validation) {
    return events;
  }

  field.validation = null;

  events.push({ type: EVENT_END, target: validation.root, currentTarget: field });

  if (field.children !== null) {
    for (const child of field.children) {
      endValidation(child, validation, events);
    }
  }

  return events;
}

function abortValidation(field: Field<ValidationPlugin>, events: ValidationEvent[]): ValidationEvent[] {
  const { validation } = field;

  if (validation !== null) {
    endValidation(validation.root, validation, events);
    validation.abortController?.abort();
  }
  return events;
}

function validate(field: Field<ValidationPlugin>, options: unknown): boolean {
  dispatchEvents(clearErrors(field, 1, abortValidation(field, [])));

  if (field.validation !== null) {
    throw new Error(ERROR_ABORT);
  }

  const validation: Validation = { root: field, abortController: null };

  dispatchEvents(startValidation(field, validation, []));

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
  dispatchEvents(clearErrors(field, 1, abortValidation(field, [])));

  if (field.validation !== null) {
    return Promise.reject(new Error(ERROR_ABORT));
  }

  const validation: Validation = { root: field, abortController: new AbortController() };

  dispatchEvents(startValidation(field, validation, []));

  if ((field.validation as Validation | null) !== validation) {
    return Promise.reject(new Error(ERROR_ABORT));
  }

  const { validate, validateAsync = validate } = field.validator;

  return Promise.race([
    new Promise(resolve => {
      resolve(validateAsync(field, options));
    }),
    new Promise((_resolve, reject) => {
      validation.abortController!.signal.addEventListener('abort', () => {
        reject(new Error(ERROR_ABORT));
      });
    }),
  ]).then(
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
  );
}

function getInvalidFields(field: Field<ValidationPlugin>, batch: Field<ValidationPlugin>[]): Field<ValidationPlugin>[] {
  if (field.error !== null) {
    batch.push(field.error);
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
