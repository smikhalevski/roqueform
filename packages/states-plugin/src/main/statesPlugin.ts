import { Field, Plugin } from "roqueform";

export interface StatesPlugin {
  isDirty: () => boolean;
  reset: () => void;
}

export function statesPlugin(): Plugin<any, StatesPlugin> {
  return enhanceField;
}

function enhanceField(field: Field): void {
  const controller: FieldController = {
    __parent: null,
    __field: field,
    __initialValue: undefined,
    __dirtySet: new Set<FieldController>()
  };

  controller.__initialValue = field.getValue();
  controller.__parent = field.parent && getController(field.parent);

  Object.defineProperty(field, CONTROLLER_SYMBOL, { value: controller, enumerable: true });

  Object.assign<Field, StatesPlugin>(field, {
    isDirty() {
      return controller.__dirtySet.size !== 0;
    },
    reset() {
      field.dispatchValue(controller.__initialValue);
    }
  });

  field.subscribe(dirtyEnhanceSubscriber);
}

function dirtyEnhanceSubscriber(field: Field): void {
  const controller = getController(field);
  const val = field.getValue();
  const isDirty = !Object.is(controller.__initialValue, field.getValue());

  if (isDirty) {
    controller.__dirtySet.add(controller);

    for (let parent = controller.__parent; parent !== null; parent = parent.__parent) {
      parent.__dirtySet.add(controller);
    }

    return;
  }

  controller.__dirtySet.delete(controller);

  for (let parent = controller.__parent; parent !== null; parent = parent.__parent) {
    parent.__dirtySet.delete(controller);
  }
}

interface FieldController {
  __parent: FieldController | null,
  __field: Field;
  __initialValue: unknown;
  __dirtySet: Set<FieldController>;
}

const CONTROLLER_SYMBOL = Symbol("statesPlugin.controller");

function getController(field: any): FieldController {
  return field[CONTROLLER_SYMBOL];
}
