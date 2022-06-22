import {Accessor, Field} from './Field';
import {EventBus} from '@smikhalevski/event-bus';
import {callOrGet} from './utils';

const IS_FIELD = Symbol();

export function createField(accessor: Accessor, initialValue?: unknown): Field<any> {
  const controller = createFieldController(accessor);
  const field = controller.__field;

  controller.__value = field.value = initialValue;

  return field;
}

export function isField(value: any): value is Field<any> {
  return value?.[IS_FIELD] === true;
}

interface FieldController {
  __parent: FieldController | null;
  __children: FieldController[] | null;
  __field: Field<unknown>;
  __key: unknown;
  __value: unknown;
  __transient: boolean;
  __eventBus: EventBus<Field<any>>;
  __accessor: Accessor;
}

function createFieldController(accessor: Accessor): FieldController {

  const field: Field<unknown> = {
    value: undefined,
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
      return getOrCreateFieldController(controller, key).__field;
    },
    subscribe(listener) {
      return controller.__eventBus.subscribe(listener);
    },
  };

  Object.defineProperty(field, IS_FIELD, {value: true});

  const controller: FieldController = {
    __parent: null,
    __children: null,
    __field: field,
    __key: null,
    __value: undefined,
    __transient: false,
    __eventBus: new EventBus(),
    __accessor: accessor,
  };

  return controller;
}

function getOrCreateFieldController(parent: FieldController, key: unknown): FieldController {

  if (parent.__children !== null) {
    for (const child of parent.__children) {
      if (Object.is(child.__key, key)) {
        return child;
      }
    }
  }

  const {__accessor} = parent;
  const controller = createFieldController(__accessor);
  controller.__parent = parent;
  controller.__key = key;
  controller.__value = controller.__field.value = __accessor.get(parent.__value, key);

  const children = parent.__children ||= [];
  children.push(controller);

  return controller;
}

function applyValue(controller: FieldController, value: unknown, transient: boolean): void {

  controller.__field.transient = controller.__transient = transient;

  if (Object.is(value, controller.__value)) {
    return;
  }

  const {__accessor} = controller;

  let rootController = controller;

  while (rootController.__parent !== null && !rootController.__transient) {
    value = __accessor.set(rootController.__parent.__value, rootController.__key, value);
  }

  propagateValue(controller.__field, rootController, value);
}

function propagateValue(originator: Field<unknown>, controller: FieldController, value: unknown): void {
  if (Object.is(value, controller.__value)) {
    return;
  }

  if (controller.__children !== null) {

    const {__accessor} = controller;

    for (const child of controller.__children) {
      if (child.__transient) {
        continue;
      }
      propagateValue(originator, child, __accessor.get(value, child.__key));
    }
  }

  controller.__field.value = controller.__value = value;

  controller.__eventBus.publish(originator);
}
