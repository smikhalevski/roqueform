import { Accessor, Field, Plugin } from './Field';
import { callOrGet, isEqual } from './utils';

/**
 * Creates the new filed instance.
 *
 * @param accessor Resolves values for derived fields.
 * @param initialValue The initial value assigned to the field.
 * @param plugin Enhances the field with additional functionality.
 *
 * @template T The value held by the field.
 * @template P The enhancement added by the plugin.
 */
export function createField<T = any, P = {}>(
  accessor: Accessor,
  initialValue?: T,
  plugin?: Plugin<T, P>
): Field<T, P> & P {
  return getOrCreateFieldController(accessor, null, null, initialValue, plugin).__field as Field<T, P> & P;
}

interface FieldController {
  __parent: FieldController | null;
  __childrenMap: Map<unknown, FieldController> | null;
  __children: FieldController[] | null;
  __field: Field;
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
  plugin: Plugin<any, {}> | undefined
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

  const listeners: Array<(field: Field) => void> = [];

  const notify = (targetField: Field): void => {
    for (const listener of listeners) {
      listener(targetField);
    }
  };

  let field: Field = {
    parent: parentField,
    key,
    getValue() {
      return controller.__value;
    },
    isTransient() {
      return controller.__transient;
    },
    dispatchValue(value) {
      applyValue(controller, callOrGet(value, controller.__value), false);
    },
    setValue(value) {
      applyValue(controller, callOrGet(value, controller.__value), true);
    },
    dispatch() {
      applyValue(controller, controller.__value, false);
    },
    at(key) {
      return getOrCreateFieldController(controller.__accessor, controller, key, null, plugin).__field;
    },
    subscribe(listener) {
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
    controller.__field = plugin(field) || field;
  }

  return controller;
}

function applyValue(controller: FieldController, value: unknown, transient: boolean): void {
  if (isEqual(value, controller.__value) && controller.__transient === transient) {
    return;
  }

  controller.__transient = transient;

  const { __accessor } = controller;

  let rootController = controller;

  while (rootController.__parent !== null && !rootController.__transient) {
    const { __key } = rootController;
    rootController = rootController.__parent;
    value = __accessor.set(rootController.__value, __key, value);
  }

  propagateValue(controller.__field, rootController, value);
}

function propagateValue(targetField: Field, controller: FieldController, value: unknown): void {
  controller.__value = value;

  if (controller.__children !== null) {
    const { __accessor } = controller;

    for (const child of controller.__children) {
      if (child.__transient) {
        continue;
      }

      const childValue = __accessor.get(value, child.__key);
      if (isEqual(child.__value, childValue)) {
        continue;
      }
      propagateValue(targetField, child, childValue);
    }
  }

  controller.__notify(targetField);
}
