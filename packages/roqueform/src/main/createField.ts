import { Accessor, Field, Event, PluginInjector } from './typings';
import { callOrGet, dispatchEvents, isEqual } from './utils';
import { naturalAccessor } from './naturalAccessor';

// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html#type-inference-in-conditional-types
type NoInfer<T> = T extends infer T ? T : never;

/**
 * Creates the new field instance.
 *
 * @template Value The root field value.
 */
export function createField<Value = any>(): Field<unknown, Value | undefined>;

/**
 * Creates the new field instance.
 *
 * @param initialValue The initial value assigned to the field.
 * @param accessor Resolves values for derived fields.
 * @template Value The root field value.
 */
export function createField<Value>(initialValue: Value, accessor?: Accessor): Field<unknown, Value>;

/**
 * Creates the new field instance.
 *
 * @param initialValue The initial value assigned to the field.
 * @param plugin The plugin that enhances the field.
 * @param accessor Resolves values for derived fields.
 * @template Value The root field initial value.
 * @template Plugin The plugin injected into the field.
 */
export function createField<Value, Plugin>(
  initialValue: Value,
  plugin: PluginInjector<Plugin, NoInfer<Value>>,
  accessor?: Accessor
): Field<Plugin, Value>;

export function createField(initialValue?: unknown, plugin?: PluginInjector | Accessor, accessor?: Accessor) {
  if (typeof plugin !== 'function') {
    accessor = plugin;
    plugin = undefined;
  }
  return getOrCreateField(accessor || naturalAccessor, null, null, initialValue, plugin || null);
}

function getOrCreateField(
  accessor: Accessor,
  parent: Field | null,
  key: unknown,
  initialValue: unknown,
  plugin: PluginInjector | null
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
    children: null,
    childrenMap: null,
    subscribers: null,
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

    at: key => getOrCreateField(child.accessor, child, key, null, plugin),

    on: (type, subscriber) => {
      let subscribers: unknown[];
      (subscribers = (child.subscribers ||= Object.create(null))[type] ||= []).push(subscriber);
      return () => {
        subscribers.splice(subscribers.indexOf(subscriber), 1);
      };
    },
  } satisfies Omit<Field, '__plugin__'> as unknown as Field;

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

function propagateValue(origin: Field, field: Field, value: unknown, events: Event[]): Event[] {
  events.push({ type: 'change:value', origin, target: field, data: field.value });

  field.value = value;

  if (field.children !== null) {
    for (const child of field.children) {
      if (child.isTransient) {
        continue;
      }

      const childValue = field.accessor.get(value, child.key);
      if (child !== origin && isEqual(child.value, childValue)) {
        continue;
      }
      propagateValue(origin, child, childValue, events);
    }
  }
  return events;
}
