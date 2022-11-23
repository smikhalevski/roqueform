import { Accessor, callAll, Field, isEqual, Plugin, Writable } from 'roqueform';
import isDeepEqual from 'fast-deep-equal';

/**
 * The enhancement added to fields by the {@linkcode resetPlugin}.
 */
export interface ResetPlugin {
  /**
   * The current value of the field.
   */
  readonly value: unknown;

  /**
   * `true` if the field value is different from its initial value, or `false` otherwise.
   */
  readonly dirty: boolean;

  /**
   * The initial field value.
   */
  readonly initialValue: this['value'];

  /**
   * Sets the initial value of the field and notifies ancestors and descendants.
   *
   * @param value The initial value to set.
   */
  setInitialValue(value: this['value']): void;

  /**
   * Reverts the field to its initial value.
   */
  reset(): void;
}

/**
 * Enhances fields with methods that manage the initial value.
 *
 * @template T The root field value.
 * @returns The plugin.
 */
export function resetPlugin<T>(
  equalityChecker: (initialValue: T, value: T) => boolean = isDeepEqual
): Plugin<T, ResetPlugin> {
  const controllerMap = new WeakMap<Field, FieldController>();

  return (field, accessor) => {
    if (!controllerMap.has(field)) {
      enhanceField(field, accessor, equalityChecker, controllerMap);
    }
  };
}

interface FieldController {
  __parent: FieldController | null;
  __children: FieldController[] | null;
  __field: Field & Writable<ResetPlugin>;
  __key: unknown;
  __initialValue: unknown;
  __accessor: Accessor;
  __equalityChecker: (initialValue: any, value: any) => boolean;
}

function enhanceField(
  field: Field,
  accessor: Accessor,
  equalityChecker: (initialValue: any, value: any) => boolean,
  controllerMap: WeakMap<Field, FieldController>
): void {
  const controller: FieldController = {
    __parent: null,
    __children: null,
    __field: field as Field & Writable<ResetPlugin>,
    __key: field.key,
    __initialValue: field.value,
    __accessor: accessor,
    __equalityChecker: equalityChecker,
  };

  controllerMap.set(field, controller);

  if (field.parent !== null) {
    const parent = controllerMap.get(field.parent)!;

    controller.__parent = parent;
    controller.__initialValue = accessor.get(parent.__initialValue, controller.__key);

    (parent.__children ||= []).push(controller);
  }

  Object.assign<Field, Omit<ResetPlugin, 'value'>>(field, {
    dirty: false,
    initialValue: controller.__initialValue,

    setInitialValue(value: any) {
      applyInitialValue(controller, value);
    },
    reset() {
      controller.__field.setValue(controller.__initialValue);
    },
  });

  field.subscribe(() => {
    updateDirty(controller);
  });

  updateDirty(controller);
}

function updateDirty(controller: FieldController): void {
  controller.__field.dirty = !controller.__equalityChecker(controller.__initialValue, controller.__field.value);
}

function applyInitialValue(controller: FieldController, initialValue: unknown): void {
  if (isEqual(controller.__initialValue, initialValue)) {
    return;
  }

  let rootController = controller;

  while (rootController.__parent !== null) {
    const { __key } = rootController;
    rootController = rootController.__parent;
    initialValue = controller.__accessor.set(rootController.__initialValue, __key, initialValue);
  }

  callAll(propagateInitialValue(controller, rootController, initialValue, []));
}

function propagateInitialValue(
  targetController: FieldController,
  controller: FieldController,
  initialValue: unknown,
  notifyCallbacks: Field['notify'][]
): Field['notify'][] {
  notifyCallbacks.push(controller.__field.notify);

  controller.__field.initialValue = controller.__initialValue = initialValue;

  updateDirty(controller);

  if (controller.__children !== null) {
    for (const child of controller.__children) {
      const childInitialValue = controller.__accessor.get(initialValue, child.__key);

      if (child !== targetController && isEqual(child.__initialValue, childInitialValue)) {
        continue;
      }
      propagateInitialValue(targetController, child, childInitialValue, notifyCallbacks);
    }
  }

  return notifyCallbacks;
}
