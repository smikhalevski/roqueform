import { naturalValueAccessor } from './naturalValueAccessor';
import type { __plugin, Event, Field, InferPlugin, PluginInjector, ValueAccessor } from './types';
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
 * @param plugins The array of plugin injectors that enhances the field.
 * @param accessor Resolves values for child fields.
 * @template Value The root field initial value.
 * @template Plugin The plugin injected into the field.
 */
export function createField<Value, Plugins extends PluginInjector<any>[]>(
  initialValue: Value,
  plugins?: Plugins,
  accessor?: ValueAccessor
): Field<Value, InferPlugin<Plugins[number]>>;

export function createField(
  initialValue?: unknown,
  plugins?: PluginInjector[] | ValueAccessor,
  accessor?: ValueAccessor
) {
  if (!Array.isArray(plugins)) {
    accessor = plugins;
    plugins = undefined;
  }
  return getOrCreateField(accessor || naturalValueAccessor, null, null, initialValue, plugins);
}

function getOrCreateField(
  accessor: ValueAccessor,
  parentField: Field | null,
  key: unknown,
  initialValue: unknown,
  plugins: PluginInjector[] | undefined
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

    at: (key, defaultValue) => getOrCreateField(field.valueAccessor, field, key, defaultValue, plugins),

    on: (type, subscriber) => {
      const subscribers = (field.subscribers[type] ||= []);

      if (!subscribers.includes(subscriber)) {
        subscribers.push(subscriber);
      }
      return () => {
        subscribers.splice(subscribers.indexOf(subscriber), 1);
      };
    },
  } satisfies Omit<Field, __plugin> as unknown as Field;

  field.rootField = field;

  if (parentField !== null) {
    const derivedValue = parentField.valueAccessor.get(parentField.value, key);

    if (derivedValue !== undefined) {
      field.value = derivedValue;
    }

    field.initialValue = parentField.valueAccessor.get(parentField.initialValue, key);
    field.rootField = parentField.rootField;
    (parentField.children ||= []).push(field);
  }

  if (plugins !== undefined) {
    for (const plugin of plugins) {
      plugin(field);
    }
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
