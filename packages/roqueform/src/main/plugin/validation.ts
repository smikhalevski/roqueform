/**
 * Enhances Roqueform fields with validation methods.
 *
 * ```ts
 * import { createField } from 'roqueform';
 * import validationPlugin from 'roqueform/plugin/validation';
 *
 * const field = createField({ hello: 'world' }, [
 *   validationPlugin({
 *     validate(field) {
 *       if (field.key === 'hello') {
 *         field.isInvalid = field.value !== 'world';
 *       }
 *     }
 *   })
 * ]);
 *
 * field.setValue({ hello: 'universe' });
 *
 * field.at('hello').validate();
 *
 * field.at('hello').isInvalid // ⮕ true
 * ```
 *
 * @module plugin/validation
 */

import { Field, FieldEvent, FieldPlugin } from '../FieldImpl.js';
import { AbortError, overrideReadonlyProperty, publishEvents } from '../utils.js';

const ERROR_ABORT = 'Validation was aborted';

/**
 * The plugin that enables a field value validation.
 *
 * @template Options Options passed to the validator.
 */
export interface ValidationMixin<Options = any> {
  /**
   * The pending validation, or `null` if there's no pending validation.
   */
  validation: Validation | null;

  /**
   * `true` if this field has an invalid value, or `false` otherwise.
   */
  isInvalid?: boolean;

  /**
   * `true` if the validation is pending, or `false` otherwise.
   */
  readonly isValidating: boolean;

  /**
   * Triggers a synchronous field validation.
   *
   * If this field is currently being validated then the validation {@link abortValidation is aborted} at the current
   * validation root.
   *
   * {@link roqueform!FieldCore.isTransient Transient} descendants of this field are excluded from validation.
   *
   * @param options Options passed to {@link Validator the validator}.
   * @returns `true` if the field is valid, or `false` if this field or any of it descendants have an associated error.
   */
  validate(options: Options): boolean;

  /**
   * Triggers an asynchronous field validation.
   *
   * If this field is currently being validated then the validation {@link abortValidation is aborted} at the current
   * validation root.
   *
   * {@link roqueform!FieldCore.isTransient Transient} descendants of this field are excluded from validation.
   *
   * @param options Options passed to {@link Validator the validator}.
   * @returns `true` if the field is valid, or `false` if this field or any of it descendants have an associated error.
   */
  validateAsync(options: Options): Promise<boolean>;

  /**
   * Aborts the async validation of the current validation root field associated with this field.
   * No-op if there's no pending validation.
   */
  abortValidation(): void;
}

/**
 * The validator to which the field value validation is delegated.
 *
 * @template Options Options passed to the validator.
 * @template Mixin The mixin added to the field.
 */
export interface Validator<Options = void, Mixin extends object = ValidationMixin<Options>> {
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
 * The validation descriptor.
 */
export interface Validation {
  /**
   * The field where the validation was triggered.
   */
  rootField: Field<any, ValidationMixin>;

  /**
   * The abort controller associated with the pending async validation, or `null` if the validation is synchronous.
   */
  abortController: AbortController | null;
}

/**
 * Private properties of the validation plugin.
 */
interface PrivateValidationMixin extends ValidationMixin {
  /**
   * The validator to which the field value validation is delegated.
   */
  _validator?: Validator<any, any>;
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
 * @template Mixin The mixin that is added to the field by other plugins.
 */
export default function validationPlugin<Options = void, Mixin extends object = ValidationMixin<Options>>(
  validator: Validator<Options, Mixin>
): FieldPlugin<any, ValidationMixin<Options>> {
  return (field: Field<unknown, PrivateValidationMixin>) => {
    field._validator = validator;

    field.validation = field.parentField !== null ? field.parentField.validation : null;

    overrideReadonlyProperty(field, 'isValidating', isValidating => isValidating || field.validation !== null);

    field.validate = options => validate(field, options);

    field.validateAsync = options => validateAsync(field, options);

    field.abortValidation = () => {
      publishEvents(abortValidation(field, []));
    };
  };
}

function containsInvalid(field: Field<unknown, PrivateValidationMixin>): boolean {
  if (field.isInvalid) {
    return true;
  }
  for (const child of field.children) {
    if (containsInvalid(child)) {
      return true;
    }
  }
  return false;
}

function startValidation(
  field: Field<any, PrivateValidationMixin>,
  validation: Validation,
  events: FieldEvent[]
): FieldEvent[] {
  field.validation = validation;

  events.push({ type: 'validationStarted', target: field, relatedTarget: validation.rootField, payload: validation });

  for (const child of field.children) {
    if (!child.isTransient) {
      startValidation(child, validation, events);
    }
  }
  return events;
}

function finishValidation(
  field: Field<any, PrivateValidationMixin>,
  validation: Validation,
  events: FieldEvent[]
): FieldEvent[] {
  if (field.validation !== validation) {
    return events;
  }

  field.validation = null;

  events.push({ type: 'validationFinished', target: field, relatedTarget: validation.rootField, payload: validation });

  for (const child of field.children) {
    finishValidation(child, validation, events);
  }
  return events;
}

function abortValidation(field: Field<unknown, PrivateValidationMixin>, events: FieldEvent[]): FieldEvent[] {
  const validation = field.validation;

  if (validation === null) {
    return events;
  }

  finishValidation(validation.rootField, validation, events);
  validation.abortController?.abort();

  return events;
}

function validate(field: Field<unknown, PrivateValidationMixin>, options: unknown): boolean {
  if (field._validator?.validate === undefined) {
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
    field._validator.validate(field, options);
  } catch (error) {
    publishEvents(finishValidation(field, validation, []));
    throw error;
  }

  if (field.validation !== validation) {
    throw AbortError(ERROR_ABORT);
  }

  publishEvents(finishValidation(field, validation, []));
  return !containsInvalid(field);
}

function validateAsync(field: Field<unknown, PrivateValidationMixin>, options: unknown): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const validator = field._validator;

    let validateAsync;

    if (validator === undefined || (validateAsync = validator.validateAsync || validator.validate) === undefined) {
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

    Promise.resolve(validateAsync.call(validator, field, options)).then(
      () => {
        if (field.validation !== validation) {
          reject(AbortError(ERROR_ABORT));
        } else {
          publishEvents(finishValidation(field, validation, []));
          resolve(!containsInvalid(field));
        }
      },
      error => {
        publishEvents(finishValidation(field, validation, []));
        reject(error);
      }
    );
  });
}
