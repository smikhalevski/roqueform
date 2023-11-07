import { Accessor, Field, PluginCallback, ValueChangeEvent } from './typings';
import { callOrGet, dispatchEvents, isEqual } from './utils';
import { naturalAccessor } from './naturalAccessor';

// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html#type-inference-in-conditional-types
type NoInfer<T> = T extends infer T ? T : never;

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
 * @param accessor Resolves values for derived fields.
 * @template Value The root field value.
 */
export function createField<Value>(initialValue: Value, accessor?: Accessor): Field<Value>;

/**
 * Creates the new field instance.
 *
 * @param initialValue The initial value assigned to the field.
 * @param plugin The plugin that enhances the field.
 * @param accessor Resolves values for derived fields.
 * @template Value The root field initial value.
 * @template Plugin The plugin added to the field.
 */
export function createField<Value, Plugin>(
  initialValue: Value,
  plugin: PluginCallback<Plugin, NoInfer<Value>>,
  accessor?: Accessor
): Field<Plugin, Value>;

export function createField(initialValue?: unknown, plugin?: PluginCallback | Accessor, accessor?: Accessor) {
  if (typeof plugin !== 'function') {
    plugin = undefined;
    accessor = plugin;
  }
  return getOrCreateField(accessor || naturalAccessor, null, null, initialValue, plugin || null);
}

function getOrCreateField(
  accessor: Accessor,
  parent: Field | null,
  key: unknown,
  initialValue: unknown,
  plugin: PluginCallback | null
): Field {
  let child: Field;

  if (parent !== null && parent.childrenMap !== null && (child = parent.childrenMap.get(key)!) !== undefined) {
    return child;
  }

  child = {
    __plugin: undefined,
    key,
    value: null,
    initialValue,
    isTransient: false,
    root: null!,
    parent,
    children: null,
    childrenMap: null,
    listeners: null,
    accessor,
    plugin,
    setValue: value => {
      setValue(child, callOrGet(value, child.value), false);
    },
    setTransientValue: value => {
      setValue(child, callOrGet(value, child.value), true);
    },
    propagate: () => {
      setValue(child, child.value, false);
    },
    at: key => {
      return getOrCreateField(child.accessor, child, key, null, plugin);
    },
    on: (type, listener) => {
      let listeners: unknown[];
      (listeners = (child.listeners ||= Object.create(null))[type] ||= []).push(listener);
      return () => {
        listeners.splice(listeners.indexOf(listener), 1);
      };
    },
  };

  child.root = child;

  if (parent !== null) {
    child.root = parent.root;
    child.value = accessor.get(parent.value, key);
    child.initialValue = accessor.get(parent.initialValue, key);
  }

  plugin?.(child);

  if (parent !== null) {
    (parent.children ||= []).push(child);
    (parent.childrenMap ||= new Map()).set(child.key, child);
  }

  return child;
}

function setValue(field: Field, value: unknown, transient: boolean): void {
  if (isEqual(field.value, value) && field.isTransient === transient) {
    return;
  }

  field.isTransient = transient;

  let changeRoot = field;

  while (changeRoot.parent !== null && !changeRoot.isTransient) {
    value = field.accessor.set(changeRoot.parent.value, changeRoot.key, value);
    changeRoot = changeRoot.parent;
  }

  dispatchEvents(propagateValue(field, changeRoot, value, []));
}

function propagateValue(target: Field, field: Field, value: unknown, events: ValueChangeEvent[]): ValueChangeEvent[] {
  events.push({ type: 'valueChange', target, currentTarget: field, previousValue: field.value });

  field.value = value;

  if (field.children !== null) {
    for (const child of field.children) {
      if (child.isTransient) {
        continue;
      }

      const childValue = field.accessor.get(value, child.key);
      if (child !== target && isEqual(child.value, childValue)) {
        continue;
      }
      propagateValue(target, child, childValue, events);
    }
  }

  return events;
}
