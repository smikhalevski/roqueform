import { Event, Field, PluginCallback } from './typings';
import { dispatchEvents, isEqual } from './utils';

const EVENT_VALIDITY_CHANGE = 'validityChange';
const EVENT_VALIDATION_START = 'validationStart';
const EVENT_VALIDATION_END = 'validationEnd';
const ERROR_VALIDATION_ABORTED = 'Validation aborted';

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
   * The type of the associated error:
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
   * The field where the validation was triggered, or `null` if there's no pending validation.
   */
  ['validationRoot']: Field<this['__plugin']> | null;

  /**
   * The abort controller associated with the pending {@link Validator.validateAsync async validation}, or `null` if
   * there's no pending async validation. Abort controller is only defined for {@link validationRoot}.
   */
  ['validationAbortController']: AbortController | null;

  /**
   * Associates an error with the field and notifies the subscribers.
   *
   * @param error The error to set. If the passed error is `null` of `undefined` then an error is deleted.
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
  on(eventType: 'validityChange', listener: (event: Event<this['value'], this['__plugin']>) => void): () => void;

  /**
   * Subscribes the listener to validation start events. The event is triggered for all fields that are going to be
   * validated. The {@link FieldController.value current value} of the field is the one that is being validated.
   * {@link Event.target} points to the field where validation was triggered.
   *
   * @param eventType The type of the event.
   * @param listener The listener that would be triggered.
   * @returns The callback to unsubscribe the listener.
   */
  on(eventType: 'validationStart', listener: (event: Event<this['value'], this['__plugin']>) => void): () => void;

  /**
   * Subscribes the listener to validation start end events. The event is triggered for all fields that were validated.
   * {@link Event.target} points to the field where validation was triggered. Check {@link isInvalid} to detect the
   * actual validity status.
   *
   * @param eventType The type of the event.
   * @param listener The listener that would be triggered.
   * @returns The callback to unsubscribe the listener.
   */
  on(eventType: 'validationEnd', listener: (event: Event<this['value'], this['__plugin']>) => void): () => void;

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
  validate(field: Field<ValidationPlugin<Error, Options>>, options: Options | undefined): void;

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
   * @param signal The signal that indicates that validation was aborted.
   * @param options The options passed to the {@link ValidationPlugin.validateAsync} method.
   */
  validateAsync?(
    field: Field<ValidationPlugin<Error, Options>>,
    signal: AbortSignal,
    options: Options | undefined
  ): Promise<void>;
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
    field.errorOrigin = 0;
    field.validator = typeof validator === 'function' ? { validate: validator } : validator;
    field.validationRoot = null;
    field.validationAbortController = null;

    Object.defineProperties(field, {
      isInvalid: { get: () => field.errorCount !== 0 },
      isValidating: { get: () => field.validationRoot !== null },
    });

    const { setValue, setTransientValue } = field;

    field.setValue = value => {
      if (field.validationRoot !== null) {
        dispatchEvents(endValidation(field, field.validationRoot, true, []));
      }
      setValue(value);
    };

    field.setTransientValue = value => {
      if (field.validationRoot !== null) {
        dispatchEvents(endValidation(field, field.validationRoot, true, []));
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

    field.getInvalidFields = () => getInvalidFields(field, []);

    field.validate = options => validate(field, options);

    field.validateAsync = options => validateAsync(field, options);

    field.abortValidation = () => {
      dispatchEvents(endValidation(field, field, true, []));
    };

    field.setValidationError = error => {
      dispatchEvents(setError(field, error, 1, []));
    };
  };
}

function setError(
  field: Field<ValidationPlugin>,
  error: unknown,
  errorOrigin: 1 | 2,
  events: Event<ValidationPlugin>[]
): Event<ValidationPlugin>[] {
  if (error === null || error === undefined) {
    return deleteError(field, errorOrigin, events);
  }

  const errored = field.error !== null;

  if (errored && isEqual(field.error, error) && field.errorOrigin === errorOrigin) {
    return events;
  }

  field.error = error;
  field.errorOrigin = errorOrigin;

  events.push({ type: EVENT_VALIDITY_CHANGE, target: field, currentTarget: field });

  if (errored) {
    return events;
  }

  field.errorCount++;

  for (let ancestor = field.parent; ancestor !== null; ancestor = ancestor.parent) {
    if (ancestor.errorCount++ === 0) {
      events.push({ type: EVENT_VALIDITY_CHANGE, target: field, currentTarget: ancestor });
    }
  }

  return events;
}

function deleteError(
  field: Field<ValidationPlugin>,
  errorOrigin: 1 | 2,
  events: Event<ValidationPlugin>[]
): Event<ValidationPlugin>[] {
  if (field.error === null || field.errorOrigin > errorOrigin) {
    return events;
  }

  field.error = null;
  field.errorOrigin = 0;
  field.errorCount--;

  events.push({ type: EVENT_VALIDITY_CHANGE, target: field, currentTarget: field });

  for (let ancestor = field.parent; ancestor !== null; ancestor = ancestor.parent) {
    if (--ancestor.errorCount === 0) {
      events.push({ type: EVENT_VALIDITY_CHANGE, target: field, currentTarget: ancestor });
    }
  }

  return events;
}

function clearErrors(
  field: Field<ValidationPlugin>,
  errorOrigin: 1 | 2,
  events: Event<ValidationPlugin>[]
): Event<ValidationPlugin>[] {
  deleteError(field, errorOrigin, events);

  if (field.children !== null) {
    for (const child of field.children) {
      clearErrors(child, errorOrigin, events);
    }
  }
  return events;
}

function startValidation(
  field: Field<ValidationPlugin>,
  validationRoot: Field<ValidationPlugin>,
  events: Event<ValidationPlugin>[]
): Event<ValidationPlugin>[] {
  field.validationRoot = validationRoot;

  events.push({ type: EVENT_VALIDATION_START, target: validationRoot, currentTarget: field });

  if (field.children !== null) {
    for (const child of field.children) {
      if (!child.isTransient) {
        startValidation(child, validationRoot, events);
      }
    }
  }
  return events;
}

function endValidation(
  field: Field<ValidationPlugin>,
  validationRoot: Field<ValidationPlugin>,
  aborted: boolean,
  events: Event<ValidationPlugin>[]
): Event<ValidationPlugin>[] {
  if (field.validationRoot !== validationRoot) {
    return events;
  }

  field.validationRoot = null;

  events.push({ type: EVENT_VALIDATION_END, target: validationRoot, currentTarget: field });

  if (field.children !== null) {
    for (const child of field.children) {
      endValidation(child, validationRoot, aborted, events);
    }
  }

  if (field.validationAbortController !== null) {
    if (aborted) {
      field.validationAbortController.abort();
    }
    field.validationAbortController = null;
  }

  return events;
}

function validate(field: Field<ValidationPlugin>, options: unknown): boolean {
  const events: Event<ValidationPlugin>[] = [];

  if (field.validationRoot !== null) {
    endValidation(field.validationRoot, field.validationRoot, true, events);
  }

  clearErrors(field, 1, events);
  startValidation(field, field, events);
  dispatchEvents(events);

  if (field.validationRoot !== field) {
    throw new Error(ERROR_VALIDATION_ABORTED);
  }

  try {
    field.validator.validate(field, options);
  } catch (error) {
    dispatchEvents(endValidation(field, field, false, []));
    throw error;
  }

  dispatchEvents(endValidation(field, field, false, []));
  return field.errorCount === 0;
}

function validateAsync(field: Field<ValidationPlugin>, options: unknown): Promise<boolean> {
  const events: Event<ValidationPlugin>[] = [];

  if (field.validationRoot !== null) {
    endValidation(field.validationRoot, field.validationRoot, true, events);
  }

  field.validationAbortController = new AbortController();

  clearErrors(field, 1, events);
  startValidation(field, field, events);
  dispatchEvents(events);

  if (field.validationRoot !== field) {
    return Promise.reject(new Error(ERROR_VALIDATION_ABORTED));
  }

  const { validate, validateAsync = validate } = field.validator;
  const signal = field.validationAbortController!.signal;

  return Promise.race([
    new Promise(resolve => {
      resolve(validateAsync(field, signal, options));
    }),
    new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => {
        reject(new Error(ERROR_VALIDATION_ABORTED));
      });
    }),
  ]).then(
    () => {
      dispatchEvents(endValidation(field, field, false, []));
      return field.errorCount === 0;
    },
    error => {
      dispatchEvents(endValidation(field, field, false, []));
      throw error;
    }
  );
}

function getInvalidFields(
  field: Field<ValidationPlugin>,
  invalidFields: Field<ValidationPlugin>[]
): Field<ValidationPlugin>[] {
  if (field.error !== null) {
    invalidFields.push(field.error);
  }
  if (field.children !== null) {
    for (const child of field.children) {
      getInvalidFields(child, invalidFields);
    }
  }
  return invalidFields;
}
