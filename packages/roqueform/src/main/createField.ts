import { Accessor, Field, NoInfer, Plugin } from './shared-types';
import { callAll, callOrGet, isEqual } from './utils';

/**
 * Creates the new field instance.
 *
 * @param accessor Resolves values for derived fields.
 */
export function createField(accessor: Accessor): Field;

/**
 * Creates the new field instance.
 *
 * @param accessor Resolves values for derived fields.
 * @param initialValue The initial value assigned to the field.
 * @template T The root field value.
 */
export function createField<T>(accessor: Accessor, initialValue: T): Field<T>;

/**
 * Creates the new field instance.
 *
 * @param accessor Resolves values for derived fields.
 * @param initialValue The initial value assigned to the field.
 * @param plugin The plugin that enhances the field.
 * @template T The root field value.
 * @template M The mixin added by the plugin.
 */
export function createField<T, M>(accessor: Accessor, initialValue: T, plugin: Plugin<M, NoInfer<T>>): Field<T, M> & M;

export function createField(accessor: Accessor, initialValue?: unknown, plugin?: Plugin) {
  return getOrCreateFieldController(accessor, null, null, initialValue, plugin).__field;
}

interface FieldController {
  __parent: FieldController | null;

  /**
   * The map from a child key to a corresponding controller.
   */
  __childrenMap: Map<unknown, FieldController> | null;
  __children: FieldController[] | null;
  __field: Field;
  __key: unknown;
  __value: unknown;
  __transient: boolean;
  __accessor: Accessor;

  __notify(targetField: Field): void;
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
    const child = parentController.__childrenMap?.get(key);

    if (child !== undefined) {
      return child;
    }

    parent = parentController.__field;
    initialValue = accessor.get(parentController.__value, key);
  }

  const listeners: Array<(targetField: Field, currentField: Field) => void> = [];

  const notify = (targetField: Field): void => {
    callAll(listeners, targetField, controller.__field);
  };

  const field = {
    setValue(value) {
      applyValue(controller, callOrGet(value, controller.__value), false);
    },
    setTransientValue(value) {
      applyValue(controller, callOrGet(value, controller.__value), true);
    },
    dispatch() {
      applyValue(controller, controller.__value, false);
    },
    at(key) {
      return getOrCreateFieldController(controller.__accessor, controller, key, null, plugin).__field;
    },
    subscribe(listener) {
      if (typeof listener === 'function') {
        listeners.push(listener);
      }
      return () => {
        listeners.splice(listeners.indexOf(listener), 1);
      };
    },
    notify() {
      notify(controller.__field);
    },
  } as Field;

  Object.defineProperties(field, {
    parent: { enumerable: true, value: parent },
    key: { enumerable: true, value: key },
    value: { enumerable: true, get: () => controller.__value },
    transient: { enumerable: true, get: () => controller.__transient },
  });

  const controller: FieldController = {
    __parent: parentController,
    __childrenMap: null,
    __children: null,
    __field: field,
    __key: key,
    __value: initialValue,
    __transient: false,
    __notify: notify,
    __accessor: accessor,
  };

  plugin?.(field, accessor);

  if (parentController !== null) {
    (parentController.__childrenMap ||= new Map()).set(key, controller);
    (parentController.__children ||= []).push(controller);
  }

  return controller;
}

function applyValue(controller: FieldController, value: unknown, transient: boolean): void {
  if (isEqual(controller.__value, value) && controller.__transient === transient) {
    return;
  }

  controller.__transient = transient;

  let rootController = controller;

  while (rootController.__parent !== null && !rootController.__transient) {
    const { __key } = rootController;
    rootController = rootController.__parent;
    value = controller.__accessor.set(rootController.__value, __key, value);
  }

  callAll(propagateValue(controller, rootController, value, []), controller.__field);
}

function propagateValue(
  targetController: FieldController,
  controller: FieldController,
  value: unknown,
  notifyCallbacks: FieldController['__notify'][]
): FieldController['__notify'][] {
  notifyCallbacks.push(controller.__notify);

  controller.__value = value;

  if (controller.__children !== null) {
    for (const child of controller.__children) {
      if (child.__transient) {
        continue;
      }

      const childValue = controller.__accessor.get(value, child.__key);
      if (child !== targetController && isEqual(child.__value, childValue)) {
        continue;
      }
      propagateValue(targetController, child, childValue, notifyCallbacks);
    }
  }

  return notifyCallbacks;
}
