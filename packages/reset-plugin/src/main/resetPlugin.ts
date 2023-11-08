import { dispatchEvents, FieldEvent, Field, isEqual, PluginCallback } from 'roqueform';
import isDeepEqual from 'fast-deep-equal';

/**
 * The plugin added to fields by the {@link resetPlugin}.
 */
export interface ResetPlugin {
  /**
   * @internal
   */
  ['__plugin']: unknown;

  /**
   * @internal
   */
  value: unknown;

  /**
   * `true` if the field value is different from its initial value, or `false` otherwise.
   */
  isDirty: boolean;

  /**
   * The callback that compares initial value and the current value of the field.
   *
   * @param initialValue The initial value.
   * @param value The current value.
   */
  ['equalityChecker']: (initialValue: any, value: any) => boolean;

  /**
   * Sets the initial value of the field and notifies ancestors and descendants.
   *
   * @param value The initial value to set.
   */
  setInitialValue(value: this['value']): void;

  /**
   * Reverts the field to its initial value.
   */
  reset(): void;

  /**
   * Subscribes the listener to field initial value change events.
   *
   * @param eventType The type of the event.
   * @param listener The listener that would be triggered.
   * @returns The callback to unsubscribe the listener.
   */
  on(
    eventType: 'initialValueChange',
    listener: (event: InitialValueChangeEvent<this['__plugin'], this['value']>) => void
  ): () => void;
}

/**
 * The event dispatched when the field initial value has changed.
 *
 * @template Plugin The plugin added to the field.
 * @template Value The field value.
 */
export interface InitialValueChangeEvent<Plugin = unknown, Value = any> extends FieldEvent<Plugin, Value> {
  type: 'initialValueChange';

  /**
   * The previous initial value that was replaced by {@link Field.initialValue the new initial value}.
   */
  previousInitialValue: Value;
}

/**
 * Enhances fields with methods that manage the initial value.
 *
 * @param equalityChecker The callback that compares initial value and the current value of the field. By default, the
 * deep comparison is used.
 */
export function resetPlugin(
  equalityChecker: (initialValue: any, value: any) => boolean = isDeepEqual
): PluginCallback<ResetPlugin> {
  return field => {
    field.isDirty = field.equalityChecker(field.initialValue, field.value);
    field.equalityChecker = equalityChecker;

    field.setInitialValue = value => {
      setInitialValue(field, value);
    };

    field.reset = () => {
      field.setValue(field.initialValue);
    };

    field.on('valueChange', () => {
      field.isDirty = field.equalityChecker(field.initialValue, field.value);
    });
  };
}

function setInitialValue(field: Field<ResetPlugin>, initialValue: unknown): void {
  if (isEqual(field.initialValue, initialValue)) {
    return;
  }

  let root = field;

  while (root.parent !== null) {
    initialValue = field.accessor.set(root.parent.value, root.key, initialValue);
    root = root.parent;
  }

  dispatchEvents(propagateInitialValue(field, root, initialValue, []));
}

function propagateInitialValue(
  target: Field<ResetPlugin>,
  field: Field<ResetPlugin>,
  initialValue: unknown,
  events: InitialValueChangeEvent[]
): InitialValueChangeEvent[] {
  events.push({
    type: 'initialValueChange',
    target: target as Field<any>,
    currentTarget: field as Field<any>,
    previousInitialValue: field.initialValue,
  });

  field.initialValue = initialValue;
  field.isDirty = field.equalityChecker(initialValue, field.initialValue);

  if (field.children !== null) {
    for (const child of field.children) {
      const childInitialValue = field.accessor.get(initialValue, child.key);
      if (child !== target && isEqual(child.initialValue, childInitialValue)) {
        continue;
      }
      propagateInitialValue(target, child, childInitialValue, events);
    }
  }
  return events;
}
