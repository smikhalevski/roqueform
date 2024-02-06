import type { Event, Field, NoInfer, PluginInjector, PluginOf, Subscriber, Unsubscribe } from './types';
import { dispatchEvents } from './utils';

const ERROR_ABORT = 'Validation aborted';

/**
 * The plugin that enables a field value validation.
 *
 * @template Options Options passed to the validator.
 */
export interface ValidationPlugin<Options = any> {
  /**
   * `true` if this field has an invalid value, or `false` otherwise.
   */
  isInvalid?: boolean;

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
   * Triggers a synchronous field validation.
   *
   * If this field is currently being validated then the validation {@link abortValidation is aborted} at current
   * {@link Validation.rootField validation root}.
   *
   * {@link Field.isTransient Transient} descendants of this field are excluded from validation.
   *
   * @param options Options passed to {@link Validator the validator}.
   * @returns `true` if the field is valid, or `false` if this field or any of it descendants have an associated error.
   */
  validate(options?: Options): boolean;

  /**
   * Triggers an asynchronous field validation.
   *
   * If this field is currently being validated then the validation {@link abortValidation is aborted} at current
   * {@link Validation.rootField validation root}.
   *
   * {@link Field.isTransient Transient} descendants of this field are excluded from validation.
   *
   * @param options Options passed to {@link Validator the validator}.
   * @returns `true` if the field is valid, or `false` if this field or any of it descendants have an associated error.
   */
  validateAsync(options?: Options): Promise<boolean>;

  /**
   * Aborts the async validation of {@link Validation.rootField the validation root field} associated with this field.
   * No-op if there's no pending validation.
   */
  abortValidation(): void;

  /**
   * Subscribes to the start of the validation. {@link Event.data} carries the validation that is going to start.
   *
   * @param eventType The type of the event.
   * @param subscriber The subscriber that would be triggered.
   * @returns The callback to unsubscribe the subscriber.
   * @see {@link validation}
   * @see {@link isValidating}
   */
  on(eventType: 'validation:start', subscriber: Subscriber<Validation<PluginOf<this>>, PluginOf<this>>): Unsubscribe;

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
  on(eventType: 'validation:end', subscriber: Subscriber<Validation<PluginOf<this>>, PluginOf<this>>): Unsubscribe;
}

/**
 * The pending validation descriptor.
 *
 * @template Plugin The plugin injected into the field.
 */
export interface Validation<Plugin = any> {
  /**
   * The field where the validation was triggered.
   */
  rootField: Field<any, Plugin>;

  /**
   * The abort controller associated with the pending {@link Validator.validateAsync async validation}, or `null` if
   * the validation is synchronous.
   */
  abortController: AbortController | null;
}

/**
 * The validator to which the field value validation is delegated.
 *
 * @template Options Options passed to the validator.
 * @template Plugin The plugin injected into the field.
 */
export interface Validator<Options = any, Plugin = any> {
  /**
   * Applies validation rules to a field.
   *
   * Before marking the field as invalid, check that {@link ValidationPlugin.validation the validation} didn't change.
   *
   * @param field The field where {@link ValidationPlugin.validate} was called.
   * @param options The options passed to the {@link ValidationPlugin.validate} method.
   */
  validate?(field: Field<any, Plugin>, options: Options | undefined): void;

  /**
   * Applies validation rules to a field. If this callback is omitted, then {@link Validator.validate} would be called
   * instead.
   *
   * Before marking the field as invalid, check that {@link ValidationPlugin.validation the validation} didn't change,
   * and {@link Validation.abortController wasn't aborted}.
   *
   * @param field The field where {@link ValidationPlugin.validateAsync} was called.
   * @param options The options passed to the {@link ValidationPlugin.validateAsync} method.
   */
  validateAsync?(field: Field<any, Plugin>, options: Options | undefined): Promise<void>;
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
export function validationPlugin<Options>(
  validator: Validator<Options, ValidationPlugin<Options>>
): PluginInjector<ValidationPlugin<Options>>;

/**
 * Enhances the field with validation methods.
 *
 * This plugin is a scaffold for implementing validation. Check out
 * [library-based validation plugins](https://github.com/smikhalevski/roqueform#plugins-and-integrations) before
 * picking this plugin.
 *
 * @param plugin The plugin that is available inside a validator.
 * @param validator The validator object or a callback that performs synchronous validation.
 * @template Plugin The plugin that is available inside a validator.
 * @template Options Options passed to the validator.
 */
export function validationPlugin<Plugin, Value, Options>(
  plugin: PluginInjector<Plugin, Value>,
  validator: Validator<Options, ValidationPlugin<Options> & NoInfer<Plugin>>
): PluginInjector<ValidationPlugin<Options> & Plugin, Value>;

export function validationPlugin(
  plugin: Validator | PluginInjector | undefined,
  validator?: Validator
): PluginInjector<ValidationPlugin> {
  if (typeof plugin !== 'function') {
    validator = plugin;
    plugin = undefined;
  }

  return field => {
    (plugin as Function)?.(field);

    field.validator = validator!;
    field.validation = field.parentField !== null ? field.parentField.validation : null;

    Object.defineProperty(field, 'isValidating', {
      configurable: true,
      get: () => field.validation !== null,
    });

    field.validate = options => validate(field, options);

    field.validateAsync = options => validateAsync(field, options);

    field.abortValidation = () => {
      dispatchEvents(abortValidation(field, []));
    };
  };
}

function containsInvalid(field: Field<unknown, ValidationPlugin>): boolean {
  if (field.isInvalid) {
    return true;
  }
  if (field.children !== null) {
    for (const child of field.children) {
      if (containsInvalid(child)) {
        return true;
      }
    }
  }
  return false;
}

function startValidation(field: Field<unknown, ValidationPlugin>, validation: Validation, events: Event[]): Event[] {
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

function endValidation(field: Field<unknown, ValidationPlugin>, validation: Validation, events: Event[]): Event[] {
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

function abortValidation(field: Field<unknown, ValidationPlugin>, events: Event[]): Event[] {
  const { validation } = field;

  if (validation !== null) {
    endValidation(validation.rootField, validation, events);
    validation.abortController?.abort();
  }
  return events;
}

function validate(field: Field<unknown, ValidationPlugin>, options: unknown): boolean {
  const { validate } = field.validator;

  if (validate === undefined) {
    throw new Error("Sync validation isn't supported");
  }

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
    validate.call(field.validator, field, options);
  } catch (error) {
    dispatchEvents(endValidation(field, validation, []));
    throw error;
  }

  if (field.validation !== validation) {
    throw new Error(ERROR_ABORT);
  }
  dispatchEvents(endValidation(field, validation, []));
  return !containsInvalid(field);
}

function validateAsync(field: Field<unknown, ValidationPlugin>, options: unknown): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const validateAsync = field.validator.validateAsync || field.validator.validate;

    if (validateAsync === undefined) {
      reject(new Error("Async validation isn't supported"));
      return;
    }

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

    validation.abortController.signal.addEventListener('abort', () => {
      reject(new Error(ERROR_ABORT));
    });

    Promise.resolve(validateAsync.call(field.validator, field, options)).then(
      () => {
        if (field.validation !== validation) {
          reject(new Error(ERROR_ABORT));
        } else {
          dispatchEvents(endValidation(field, validation, []));
          resolve(!containsInvalid(field));
        }
      },
      error => {
        dispatchEvents(endValidation(field, validation, []));
        reject(error);
      }
    );
  });
}
