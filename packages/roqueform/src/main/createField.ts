import { naturalValueAccessor } from './naturalValueAccessor';
import type { __PLUGIN__, Event, Field, NoInfer, PluginInjector, ValueAccessor } from './types';
import { callOrGet, dispatchEvents, isEqual } from './utils';

/**
 * Creates the new field instance.
 *
 * @template Value The root field value.
 */
export function createField<Value = any>(): Field<Value | undefined>;

/**
 * Creates the new field instance.
 *
 * @param initialValue The initial value assigned to the field.
 * @param accessor Resolves values for child fields.
 * @template Value The root field value.
 */
export function createField<Value>(initialValue: Value, accessor?: ValueAccessor): Field<Value>;

/**
 * Creates the new field instance.
 *
 * @param initialValue The initial value assigned to the field.
 * @param plugin The plugin injector that enhances the field.
 * @param accessor Resolves values for child fields.
 * @template Value The root field initial value.
 * @template Plugin The plugin injected into the field.
 */
export function createField<Value, Plugin>(
  initialValue: Value,
  plugin: PluginInjector<Plugin>,
  accessor?: ValueAccessor
): Field<Value, Plugin>;

/**
 * Creates the new field instance.
 *
 * @param initialValue The initial value assigned to the field.
 * @param plugin The plugin injector that enhances the field.
 * @param accessor Resolves values for child fields.
 * @template Value The root field initial value.
 * @template Plugin The plugin injected into the field.
 */
export function createField<Value, Plugin>(
  initialValue: Value,
  plugin: PluginInjector<Plugin, NoInfer<Value>>,
  accessor?: ValueAccessor
): Field<Value, Plugin>;

export function createField(initialValue?: unknown, plugin?: PluginInjector | ValueAccessor, accessor?: ValueAccessor) {
  if (typeof plugin !== 'function') {
    accessor = plugin;
    plugin = undefined;
  }
  return getOrCreateField(accessor || naturalValueAccessor, null, null, initialValue, plugin || null);
}

function getOrCreateField(
  accessor: ValueAccessor,
  parentField: Field | null,
  key: unknown,
  initialValue: unknown,
  plugin: PluginInjector | null
): Field {
  if (parentField !== null && parentField.children !== null) {
    for (const child of parentField.children) {
      if (isEqual(child.key, key)) {
        return child;
      }
    }
  }

  const field = {
    key,
    value: initialValue,
    initialValue,
    isTransient: false,
    rootField: null!,
    parentField,
    children: null,
    subscribers: Object.create(null),
    valueAccessor: accessor,

    setValue: value => {
      setValue(field, callOrGet(value, field.value), false);
    },

    setTransientValue: value => {
      setValue(field, callOrGet(value, field.value), true);
    },

    propagate: () => {
      setValue(field, field.value, false);
    },

    at: key => getOrCreateField(field.valueAccessor, field, key, null, plugin),

    on: (type, subscriber) => {
      const subscribers = (field.subscribers[type] ||= []);

      if (!subscribers.includes(subscriber)) {
        subscribers.push(subscriber);
      }
      return () => {
        subscribers.splice(subscribers.indexOf(subscriber), 1);
      };
    },
  } satisfies Omit<Field, __PLUGIN__> as unknown as Field;

  field.rootField = field;

  if (parentField !== null) {
    field.value = parentField.valueAccessor.get(parentField.value, key);
    field.initialValue = parentField.valueAccessor.get(parentField.initialValue, key);
    field.rootField = parentField.rootField;
    (parentField.children ||= []).push(field);
  }

  if (plugin !== null) {
    plugin(field);
  }
  return field;
}

function setValue(field: Field, value: unknown, transient: boolean): void {
  if (isEqual(field.value, value) && field.isTransient === transient) {
    return;
  }

  field.isTransient = transient;

  let root = field;

  while (root.parentField !== null && !root.isTransient) {
    value = root.parentField.valueAccessor.set(root.parentField.value, root.key, value);
    root = root.parentField;
  }

  dispatchEvents(propagateValue(field, root, value, []));
}

function propagateValue(originField: Field, targetField: Field, value: unknown, events: Event[]): Event[] {
  events.push({ type: 'change:value', targetField, originField, data: targetField.value });

  targetField.value = value;

  if (targetField.children !== null) {
    for (const child of targetField.children) {
      if (child.isTransient) {
        continue;
      }

      const childValue = targetField.valueAccessor.get(value, child.key);
      if (child !== originField && isEqual(child.value, childValue)) {
        continue;
      }
      propagateValue(originField, child, childValue, events);
    }
  }
  return events;
}
