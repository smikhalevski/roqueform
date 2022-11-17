import { Accessor, Field, Plugin } from './Field';
import { callAll, callOrGet, isEqual, Writable } from './utils';

/**
 * Creates the new filed instance.
 *
 * @param accessor Resolves values for derived fields.
 */
export function createField(accessor: Accessor): Field;

/**
 * Creates the new filed instance.
 *
 * @param accessor Resolves values for derived fields.
 * @param initialValue The initial value assigned to the field.
 * @template T The value controlled by the field.
 */
export function createField<T>(accessor: Accessor, initialValue: T): Field<T>;

/**
 * Creates the new filed instance.
 *
 * @param accessor Resolves values for derived fields.
 * @param initialValue The initial value assigned to the field.
 * @param plugin Enhances the field with additional functionality.
 * @template T The value controlled by the field.
 * @template P The enhancement added by the plugin.
 */
export function createField<T, P>(accessor: Accessor, initialValue: T, plugin: Plugin<T, P>): Field<T, P> & P;

export function createField(accessor: Accessor, initialValue?: unknown, plugin?: Plugin<unknown, unknown>) {
  return getOrCreateFieldController(accessor, null, null, initialValue, plugin).__field;
}

interface FieldController {
  __parent: FieldController | null;

  /**
   * The map from a child key to a corresponding controller.
   */
  __childrenMap: Map<unknown, FieldController> | null;
  __children: FieldController[] | null;
  __field: Writable<Field>;
  __key: unknown;
  __value: unknown;
  __transient: boolean;
  __notify: (targetField: Field) => void;
  __accessor: Accessor;
}

function getOrCreateFieldController(
  accessor: Accessor,
  parent: FieldController | null,
  key: unknown,
  initialValue: unknown,
  plugin: Plugin<any, any> | undefined
): FieldController {
  let parentField: Field | null = null;

  if (parent !== null) {
    const child = parent.__childrenMap?.get(key);

    if (child !== undefined) {
      return child;
    }

    parentField = parent.__field;
    initialValue = accessor.get(parent.__value, key);
  }

  const listeners: Array<(targetField: Field, currentField: Field) => void> = [];

  const notify = (targetField: Field): void => {
    callAll(listeners, targetField, controller.__field);
  };

  const field: Field = {
    parent: parentField,
    key,
    value: initialValue,
    transient: false,

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
      if (typeof listener !== 'function') {
        throw new Error('Expected a listener to be a function');
      }
      listeners.push(listener);

      return () => {
        listeners.splice(listeners.indexOf(listener), 1);
      };
    },
    notify() {
      notify(controller.__field);
    },
  };

  const controller: FieldController = {
    __parent: parent,
    __childrenMap: null,
    __children: null,
    __field: field,
    __key: key,
    __value: initialValue,
    __transient: false,
    __notify: notify,
    __accessor: accessor,
  };

  if (parent !== null) {
    (parent.__childrenMap ||= new Map()).set(key, controller);
    (parent.__children ||= []).push(controller);
  }

  if (typeof plugin === 'function') {
    controller.__field = plugin(field, accessor) || field;
  }

  return controller;
}

function applyValue(controller: FieldController, value: unknown, transient: boolean): void {
  if (isEqual(controller.__value, value) && controller.__transient === transient) {
    return;
  }

  controller.__field.transient = controller.__transient = transient;

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

  controller.__field.value = controller.__value = value;

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
