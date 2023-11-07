import { ValueAccessor, ValueChangeEvent, Field, PluginCallback, Event } from './typings';
import { callOrGet, isEqual } from './utils';
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
export function createField<Value>(initialValue: Value, accessor?: ValueAccessor): Field<Value>;

/**
 * Creates the new field instance.
 *
 * @param initialValue The initial value assigned to the field.
 * @param plugin The plugin that enhances the field.
 * @param valueAccessor Resolves values for derived fields.
 * @template Value The root field initial value.
 * @template Plugin The plugin added to the field.
 */
export function createField<Value, Plugin>(
  initialValue: Value,
  plugin: PluginCallback<Plugin, NoInfer<Value>>,
  valueAccessor?: ValueAccessor
): Field<Value, Plugin>;

export function createField(
  initialValue?: unknown,
  plugin?: PluginCallback | ValueAccessor,
  valueAccessor?: ValueAccessor
) {
  if (typeof plugin !== 'function') {
    plugin = undefined;
    valueAccessor = plugin;
  }
  return getOrCreateField(valueAccessor || naturalAccessor, null, null, initialValue, plugin || null);
}

function getOrCreateField(
  valueAccessor: ValueAccessor,
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
    key,
    value: null,
    initialValue,
    isTransient: false,
    root: null!,
    parent,
    children: [],
    childrenMap: new Map(),
    eventListeners: Object.create(null),
    valueAccessor,
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
      return getOrCreateField(child.valueAccessor, child, key, null, plugin);
    },
    on: (type, listener: (event: any) => void) => {
      let listeners = child.eventListeners[type];

      if (listeners !== undefined) {
        listeners.push(listener);
      } else {
        listeners = child.eventListeners[type] = [listener];
      }
      return () => {
        listeners.splice(listeners.indexOf(listener), 1);
      };
    },
  };

  child.root = child;

  if (parent !== null) {
    child.root = parent.root;
    child.value = valueAccessor.get(parent.value, key);
    child.initialValue = valueAccessor.get(parent.initialValue, key);
  }

  plugin?.(child);

  if (parent !== null) {
    parent.children.push(child);
    parent.childrenMap.set(child.key, child);
  }

  return child;
}

function callAll(listeners: Array<(event: Event) => void> | undefined, event: Event): void {
  if (listeners === undefined) {
    return;
  }
  for (const listener of listeners) {
    try {
      listener(event);
    } catch (error) {
      setTimeout(() => {
        throw error;
      }, 0);
    }
  }
}

function dispatchEvents(events: Event[]): void {
  for (const event of events) {
    callAll(event.currentTarget.eventListeners[event.type], event);
    callAll(event.currentTarget.eventListeners['*'], event);
  }
}

function setValue(field: Field, value: unknown, transient: boolean): void {
  if (isEqual(field.value, value) && field.isTransient === transient) {
    return;
  }

  field.isTransient = transient;

  let changeRoot = field;

  while (changeRoot.parent !== null && !changeRoot.isTransient) {
    value = field.valueAccessor.set(changeRoot.parent.value, changeRoot.key, value);
    changeRoot = changeRoot.parent;
  }

  dispatchEvents(applyValue(field, changeRoot, value, []));
}

function applyValue(target: Field, field: Field, value: unknown, events: ValueChangeEvent[]): ValueChangeEvent[] {
  events.push({ type: 'change', target, currentTarget: field, previousValue: field.value });

  field.value = value;

  if (field.children !== null) {
    for (const child of field.children) {
      if (child.isTransient) {
        continue;
      }

      const childValue = field.valueAccessor.get(value, child.key);
      if (child !== target && isEqual(child.value, childValue)) {
        continue;
      }
      applyValue(target, child, childValue, events);
    }
  }

  return events;
}
