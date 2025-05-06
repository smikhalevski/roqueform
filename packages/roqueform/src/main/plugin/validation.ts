import { Field, FieldEvent, FieldPlugin, InferMixin } from '../Field';
import { AbortError, publishEvents } from '../utils';

const ERROR_ABORT = 'Validation was aborted';

/**
 * The plugin that enables a field value validation.
 *
 * @template Options Options passed to the validator.
 */
export interface ValidationMixin<Options = any> {
  /**
   * `true` if the validation is pending, or `false` otherwise.
   */
  readonly isValidating: boolean;

  /**
   * The validator to which the field value validation is delegated.
   */
  validator: Validator<Options, InferMixin<this>>;

  /**
   * The pending validation, or `null` if there's no pending validation.
   */
  validation: Validation<InferMixin<this>> | null;

  /**
   * Triggers a synchronous field validation.
   *
   * If this field is currently being validated then the validation {@link abortValidation is aborted} at current
   * {@link Validation.rootField validation root}.
   *
   * {@link BareField.isTransient Transient} descendants of this field are excluded from validation.
   *
   * @param options Options passed to {@link Validator the validator}.
   * @returns `true` if the field is valid, or `false` if this field or any of it descendants have an associated error.
   */
  validate(options: Options): void;

  /**
   * Triggers an asynchronous field validation.
   *
   * If this field is currently being validated then the validation {@link abortValidation is aborted} at current
   * {@link Validation.rootField validation root}.
   *
   * {@link BareField.isTransient Transient} descendants of this field are excluded from validation.
   *
   * @param options Options passed to {@link Validator the validator}.
   * @returns `true` if the field is valid, or `false` if this field or any of it descendants have an associated error.
   */
  validateAsync(options: Options): Promise<void>;

  /**
   * Aborts the async validation of {@link Validation.rootField the validation root field} associated with this field.
   * No-op if there's no pending validation.
   */
  abortValidation(): void;
}

/**
 * The pending validation descriptor.
 *
 * @template Mixin The mixin added to the field.
 */
export interface Validation<Mixin = any> {
  /**
   * The field where the validation was triggered.
   */
  rootField: Field<any, Mixin>;

  /**
   * The abort controller associated with the pending async validation, or `null` if the validation is synchronous.
   */
  abortController: AbortController | null;
}

/**
 * The validator to which the field value validation is delegated.
 *
 * @template Options Options passed to the validator.
 * @template Mixin The mixin added to the field.
 */
export interface Validator<Options = void, Mixin = any> {
  /**
   * Applies validation rules to a field.
   *
   * Before marking the field as invalid, check that {@link ValidationMixin.validation the validation} didn't change.
   *
   * @param field The field where {@link ValidationMixin.validate} was called.
   * @param options The options passed to the {@link ValidationMixin.validate} method.
   */
  validate?(field: Field<any, Mixin>, options: Options): void;

  /**
   * Applies validation rules to a field. If this callback is omitted, then {@link Validator.validate} would be called
   * instead.
   *
   * Before marking the field as invalid, check that {@link ValidationMixin.validation the validation} didn't change,
   * and {@link Validation.abortController wasn't aborted}.
   *
   * @param field The field where {@link ValidationMixin.validateAsync} was called.
   * @param options The options passed to the {@link ValidationMixin.validateAsync} method.
   */
  validateAsync?(field: Field<any, Mixin>, options: Options): Promise<void>;
}

/**
 * Enhances the field with validation methods.
 *
 * This plugin is a scaffold for implementing validation. Check out
 * [library-based validation plugins](https://github.com/smikhalevski/roqueform#plugins-and-integrations) before
 * picking this plugin.
 *
 * @param validator The validator object or a callback that performs synchronous validation.
 * @template Options Options passed to the validator.
 */
export default function validationPlugin<Options = void>(
  validator: Validator<Options>
): FieldPlugin<any, ValidationMixin<Options>> {
  return field => {
    field.validator = validator;

    field.validation = field.parentField !== null ? field.parentField.validation : null;

    Object.defineProperty(field, 'isValidating', {
      configurable: true,

      get: () => field.validation !== null,
    });

    field.validate = options => validate(field, options);

    field.validateAsync = options => validateAsync(field, options);

    field.abortValidation = () => {
      publishEvents(abortValidation(field, []));
    };
  };
}

function startValidation(
  field: Field<any, ValidationMixin>,
  validation: Validation,
  events: FieldEvent[]
): FieldEvent[] {
  field.validation = validation;

  events.push(new FieldEvent('validationStarted', field, validation.rootField, validation));

  for (const child of field.children) {
    if (!child.isTransient) {
      startValidation(child, validation, events);
    }
  }
  return events;
}

function finishValidation(
  field: Field<any, ValidationMixin>,
  validation: Validation,
  events: FieldEvent[]
): FieldEvent[] {
  if (field.validation !== validation) {
    return events;
  }

  field.validation = null;

  events.push(new FieldEvent('validationFinished', field, validation.rootField, validation));

  for (const child of field.children) {
    finishValidation(child, validation, events);
  }
  return events;
}

function abortValidation(field: Field<unknown, ValidationMixin>, events: FieldEvent[]): FieldEvent[] {
  const { validation } = field;

  if (validation !== null) {
    finishValidation(validation.rootField, validation, events);
    validation.abortController?.abort();
  }
  return events;
}

function validate(field: Field<unknown, ValidationMixin>, options: unknown): void {
  const { validate } = field.validator;

  if (validate === undefined) {
    throw new Error("Sync validation isn't supported");
  }

  publishEvents(abortValidation(field, []));

  if (field.validation !== null) {
    throw AbortError(ERROR_ABORT);
  }

  const validation: Validation = { rootField: field, abortController: null };

  try {
    publishEvents(startValidation(field, validation, []));
  } catch (error) {
    publishEvents(finishValidation(field, validation, []));
    throw error;
  }

  if (field.validation !== validation) {
    throw AbortError(ERROR_ABORT);
  }

  try {
    validate.call(field.validator, field, options);
  } catch (error) {
    publishEvents(finishValidation(field, validation, []));
    throw error;
  }

  if (field.validation !== validation) {
    throw AbortError(ERROR_ABORT);
  }

  publishEvents(finishValidation(field, validation, []));
}

function validateAsync(field: Field<unknown, ValidationMixin>, options: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const validateAsync = field.validator.validateAsync || field.validator.validate;

    if (validateAsync === undefined) {
      reject(new Error("Async validation isn't supported"));
      return;
    }

    publishEvents(abortValidation(field, []));

    if (field.validation !== null) {
      reject(AbortError(ERROR_ABORT));
      return;
    }

    const validation: Validation = { rootField: field, abortController: new AbortController() };

    try {
      publishEvents(startValidation(field, validation, []));
    } catch (error) {
      publishEvents(finishValidation(field, validation, []));
      reject(error);
      return;
    }

    if ((field.validation as Validation | null) !== validation || validation.abortController === null) {
      reject(AbortError(ERROR_ABORT));
      return;
    }

    validation.abortController.signal.addEventListener('abort', () => {
      reject(AbortError(ERROR_ABORT));
    });

    Promise.resolve(validateAsync.call(field.validator, field, options)).then(
      () => {
        if (field.validation !== validation) {
          reject(AbortError(ERROR_ABORT));
        } else {
          publishEvents(finishValidation(field, validation, []));
          resolve();
        }
      },
      error => {
        publishEvents(finishValidation(field, validation, []));
        reject(error);
      }
    );
  });
}
