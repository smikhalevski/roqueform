import {Accessor, Enhancer, Field} from './Field';
import {EventBus} from '@smikhalevski/event-bus';
import {callOrGet} from './utils';

/**
 * Creates the new filed instance.
 *
 * @param accessor Resolves values for derived fields.
 * @param initialValue The initial value assigned to the field.
 * @param enhancer Enhances the field with additional functionality.
 *
 * @template T The type of the value held by the field.
 * @template M The type of mixin added by the enhancer.
 */
export function createField<T = any, M = {}>(accessor: Accessor, initialValue?: T, enhancer?: Enhancer<M>): Field<T, M> & M {
  return getOrCreateFieldController(accessor, null, null, initialValue, enhancer).__field as Field<T, M> & M;
}

interface FieldController {
  __parent: FieldController | null;
  __children: FieldController[] | null;
  __field: Field;
  __key: unknown;
  __value: unknown;
  __transient: boolean;
  __eventBus: EventBus<Field>;
  __accessor: Accessor;
}

function getOrCreateFieldController(accessor: Accessor, parent: FieldController | null, key: unknown, initialValue: unknown, enhancer: Enhancer<{}> | undefined): FieldController {

  let parentField: Field | null = null;

  if (parent !== null) {

    if (parent.__children !== null) {
      for (const child of parent.__children) {
        if (Object.is(child.__key, key)) {
          return child;
        }
      }
    }
    parentField = parent.__field;
    initialValue = accessor.get(parent.__value, key);
  }

  const eventBus = new EventBus<Field>();

  let field: Field = {
    parent: parentField,
    key,
    value: initialValue,
    transient: false,

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
      return getOrCreateFieldController(accessor, controller, key, null, enhancer).__field;
    },
    subscribe(listener) {
      return eventBus.subscribe(listener);
    },
    notify() {
      eventBus.publish(field);
    },
  };

  const controller: FieldController = {
    __parent: parent,
    __children: null,
    __field: field,
    __key: key,
    __value: initialValue,
    __transient: false,
    __eventBus: eventBus,
    __accessor: accessor,
  };

  if (parent !== null) {
    const children = parent.__children ||= [];
    children.push(controller);
  }

  if (typeof enhancer === 'function') {
    field = controller.__field = enhancer(field) || field;
  }

  return controller;
}

function applyValue(controller: FieldController, value: unknown, transient: boolean): void {
  if (Object.is(value, controller.__value) && controller.__transient === transient) {
    return;
  }

  controller.__field.transient = controller.__transient = transient;

  const {__accessor} = controller;

  let rootController = controller;

  while (rootController.__parent !== null && !rootController.__transient) {
    const {__key} = rootController;
    rootController = rootController.__parent;
    value = __accessor.set(rootController.__value, __key, value);
  }

  propagateValue(controller.__field, rootController, value);
}

function propagateValue(targetField: Field, controller: FieldController, value: unknown): void {
  if (controller.__children !== null) {

    const {__accessor} = controller;

    for (const child of controller.__children) {
      if (child.__transient) {
        continue;
      }

      const childValue = __accessor.get(value, child.__key);
      if (Object.is(child.__value, childValue)) {
        continue;
      }
      propagateValue(targetField, child, childValue);
    }
  }

  controller.__field.value = controller.__value = value;
  controller.__eventBus.publish(targetField);
}
