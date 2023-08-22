import { Accessor, Field, Plugin } from './shared-types';
import { callAll, callOrGet, isEqual } from './utils';
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
 * @template Value The root field value.
 * @template Mixin The mixin added by the plugin.
 */
export function createField<Value, Mixin>(
  initialValue: Value,
  plugin: Plugin<Mixin, NoInfer<Value>>,
  accessor?: Accessor
): Field<Value, Mixin> & Mixin;

export function createField(initialValue?: unknown, plugin?: Plugin | Accessor, accessor?: Accessor) {
  if (typeof plugin !== 'function') {
    plugin = undefined;
    accessor = plugin;
  }
  return getOrCreateFieldController(accessor || naturalAccessor, null, null, initialValue, plugin)._field;
}

interface FieldController {
  _parent: FieldController | null;

  /**
   * The map from a child key to a corresponding controller.
   */
  _childrenMap: Map<unknown, FieldController> | null;
  _children: FieldController[] | null;
  _field: Field;
  _key: unknown;
  _value: unknown;
  _isTransient: boolean;
  _accessor: Accessor;
  _notify: (updatedField: Field) => void;
}

function getOrCreateFieldController(
  accessor: Accessor,
  parentController: FieldController | null,
  key: unknown,
  initialValue: unknown,
  plugin: Plugin | undefined
): FieldController {
  let parent: Field | null = null;

  if (parentController !== null) {
    const child = parentController._childrenMap?.get(key);

    if (child !== undefined) {
      return child;
    }

    parent = parentController._field;
    initialValue = accessor.get(parentController._value, key);
  }

  const listeners: Array<(updatedField: Field, currentField: Field) => void> = [];

  const notify = (updatedField: Field): void => {
    callAll(listeners, [updatedField, controller._field]);
  };

  const field = {
    setValue(value) {
      applyValue(controller, callOrGet(value, [controller._value]), false);
    },
    setTransientValue(value) {
      applyValue(controller, callOrGet(value, [controller._value]), true);
    },
    dispatch() {
      applyValue(controller, controller._value, false);
    },
    at(key) {
      return getOrCreateFieldController(controller._accessor, controller, key, null, plugin)._field;
    },
    subscribe(listener) {
      if (typeof listener === 'function' && listeners.indexOf(listener) === -1) {
        listeners.push(listener);
      }
      return () => {
        listeners.splice(listeners.indexOf(listener), 1);
      };
    },
  } as Field;

  Object.defineProperties(field, {
    parent: { enumerable: true, value: parent },
    key: { enumerable: true, value: key },
    value: { enumerable: true, get: () => controller._value },
    isTransient: { enumerable: true, get: () => controller._isTransient },
  });

  const controller: FieldController = {
    _parent: parentController,
    _childrenMap: null,
    _children: null,
    _field: field,
    _key: key,
    _value: initialValue,
    _isTransient: false,
    _notify: notify,
    _accessor: accessor,
  };

  plugin?.(field, accessor, () => notify(controller._field));

  if (parentController !== null) {
    (parentController._childrenMap ||= new Map()).set(key, controller);
    (parentController._children ||= []).push(controller);
  }

  return controller;
}

function applyValue(controller: FieldController, value: unknown, transient: boolean): void {
  if (isEqual(controller._value, value) && controller._isTransient === transient) {
    return;
  }

  controller._isTransient = transient;

  let rootController = controller;

  while (rootController._parent !== null && !rootController._isTransient) {
    const { _key } = rootController;
    rootController = rootController._parent;
    value = controller._accessor.set(rootController._value, _key, value);
  }

  callAll(propagateValue(controller, rootController, value, []), [controller._field]);
}

function propagateValue(
  targetController: FieldController,
  controller: FieldController,
  value: unknown,
  notifyCallbacks: FieldController['_notify'][]
): FieldController['_notify'][] {
  notifyCallbacks.push(controller._notify);

  controller._value = value;

  if (controller._children !== null) {
    for (const child of controller._children) {
      if (child._isTransient) {
        continue;
      }

      const childValue = controller._accessor.get(value, child._key);
      if (child !== targetController && isEqual(child._value, childValue)) {
        continue;
      }
      propagateValue(targetController, child, childValue, notifyCallbacks);
    }
  }

  return notifyCallbacks;
}
