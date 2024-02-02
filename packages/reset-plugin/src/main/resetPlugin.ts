import {
  dispatchEvents,
  Event,
  Field,
  isEqual,
  PluginInjector,
  PluginOf,
  Subscriber,
  Unsubscribe,
  ValueOf,
} from 'roqueform';
import isDeepEqual from 'fast-deep-equal';

/**
 * The plugin added to fields by the {@link resetPlugin}.
 */
export interface ResetPlugin {
  /**
   * `true` if the field value is different from its initial value.
   */
  readonly isDirty: boolean;

  /**
   * Sets the initial value of the field and notifies ancestors and descendants.
   *
   * @param value The initial value to set.
   */
  setInitialValue(value: ValueOf<this>): void;

  /**
   * Reverts the field to its initial value.
   */
  reset(): void;

  /**
   * Returns all fields that have {@link roqueform!FieldBase.value a value} that is different from
   * {@link roqueform!FieldBase.initialValue an initial value}.
   *
   * @see {@link isDirty}
   */
  getDirtyFields(): Field<any, PluginOf<this>>[];

  /**
   * Subscribes to changes of {@link roqueform!FieldBase.initialValue the initial value}.
   *
   * @param eventType The type of the event.
   * @param subscriber The subscriber that would be triggered.
   * @returns The callback to unsubscribe the subscriber.
   */
  on(eventType: 'change:initialValue', subscriber: Subscriber<any, PluginOf<this>>): Unsubscribe;
}

/**
 * Enhances fields with methods that manage the initial value.
 *
 * @param equalityChecker The callback that compares initial value and the current value of the field. By default, the
 * deep comparison is used.
 */
export function resetPlugin(
  equalityChecker: (initialValue: any, value: any) => boolean = isDeepEqual
): PluginInjector<ResetPlugin> {
  return field => {
    Object.defineProperty(field, 'isDirty', {
      configurable: true,
      get: () => !equalityChecker(field.initialValue, field.value),
    });

    field.setInitialValue = value => {
      setInitialValue(field, value);
    };

    field.reset = () => {
      field.setValue(field.initialValue);
    };

    field.getDirtyFields = () => getDirtyFields(field, []);
  };
}

function setInitialValue(field: Field<unknown, ResetPlugin>, initialValue: unknown): void {
  if (isEqual(field.initialValue, initialValue)) {
    return;
  }

  let root = field;

  while (root.parentField !== null) {
    initialValue = field.valueAccessor.set(root.parentField.value, root.key, initialValue);
    root = root.parentField;
  }

  dispatchEvents(propagateInitialValue(field, root, initialValue, []));
}

function propagateInitialValue(
  originField: Field<unknown, ResetPlugin>,
  targetField: Field<unknown, ResetPlugin>,
  initialValue: unknown,
  events: Event[]
): Event[] {
  events.push({ type: 'change:initialValue', targetField, originField, data: targetField.initialValue });

  targetField.initialValue = initialValue;

  if (targetField.children !== null) {
    for (const child of targetField.children) {
      const childInitialValue = targetField.valueAccessor.get(initialValue, child.key);
      if (child !== originField && isEqual(child.initialValue, childInitialValue)) {
        continue;
      }
      propagateInitialValue(originField, child, childInitialValue, events);
    }
  }
  return events;
}

function getDirtyFields(
  field: Field<unknown, ResetPlugin>,
  batch: Field<unknown, ResetPlugin>[]
): Field<unknown, ResetPlugin>[] {
  if (field.isDirty) {
    batch.push(field);
  }
  if (field.children !== null) {
    for (const child of field.children) {
      getDirtyFields(child, batch);
    }
  }
  return batch;
}
