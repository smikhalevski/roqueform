import type { Event, Field, PluginInjector, PluginOf, Subscriber, Unsubscribe } from './types';
import { dispatchEvents } from './utils';

const EVENT_CHANGE_ERRORS = 'change:errors';

/**
 * Options of the {@link ErrorsPlugin.clearErrors} method.
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
 * The plugin that enables a field errors.
 *
 * @template Error The error associated with the field.
 */
export interface ErrorsPlugin<Error = any> {
  /**
   * The array of errors associated with this field.
   */
  errors: readonly Error[];

  /**
   * `true` if this field has associated errors, or `false` otherwise.
   */
  readonly isInvalid: boolean;

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
  getInvalidFields(): Field<any, PluginOf<this>>[];

  /**
   * Subscribes to {@link errors an associated error} changes.
   *
   * @param eventType The type of the event.
   * @param subscriber The subscriber that would be triggered.
   * @returns The callback to unsubscribe the subscriber.
   * @see {@link errors}
   * @see {@link isInvalid}
   */
  on(eventType: 'change:errors', subscriber: Subscriber<Error[], PluginOf<this>>): Unsubscribe;
}

/**
 * Enhances the field with errors.
 *
 * @param concatErrors The callback that returns the new array of errors that includes the given error, or returns the
 * original errors array if there are no changes. By default, only identity-based-unique errors are added.
 * @template Error The error associated with the field.
 */
export function errorsPlugin<Error = any>(
  /**
   * The callback that returns the new array of errors that includes the given error, or returns the original errors
   * array if there are no changes. By default, only identity-based-unique errors are added.
   *
   * @param errors The array of current errors.
   * @param error The new error to add.
   * @returns The new array of errors that includes the given error.
   * @template Error The error associated with the field.
   */
  concatErrors: (errors: readonly Error[], error: Error) => readonly Error[] = concatUniqueErrors
): PluginInjector<ErrorsPlugin<Error>> {
  return field => {
    field.errors = [];

    const isInvalid = Object.getOwnPropertyDescriptor(field, 'isInvalid')?.get;

    Object.defineProperty(field, 'isInvalid', {
      configurable: true,
      get: () => (isInvalid !== undefined && isInvalid()) || field.errors.length !== 0,
    });

    field.addError = error => {
      const prevErrors = field.errors;
      const nextErrors = concatErrors(prevErrors, error);

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
  };
}

function concatUniqueErrors<T>(errors: readonly T[], error: T): readonly T[] {
  if (!errors.includes(error)) {
    (errors = errors.slice(0)).push(error);
  }
  return errors;
}

function clearErrors(
  field: Field<unknown, ErrorsPlugin>,
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

function getInvalidFields(
  field: Field<unknown, ErrorsPlugin>,
  batch: Field<unknown, ErrorsPlugin>[]
): Field<unknown, ErrorsPlugin>[] {
  if (field.isInvalid) {
    batch.push(field);
  }
  if (field.children !== null) {
    for (const child of field.children) {
      getInvalidFields(child, batch);
    }
  }
  return batch;
}
