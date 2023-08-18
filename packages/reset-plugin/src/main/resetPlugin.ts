import { Accessor, callAll, Field, isEqual, Plugin } from 'roqueform';
import isDeepEqual from 'fast-deep-equal';

/**
 * The mixin added to fields by the {@link resetPlugin}.
 */
export interface ResetMixin {
  /**
   * @internal
   */
  readonly value: unknown;

  /**
   * `true` if the field value is different from its initial value, or `false` otherwise.
   */
  readonly isDirty: boolean;

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
 * @param equalityChecker The callback that compares initial value and the current value of the field. By default, the
 * deep comparison is used.
 */
export function resetPlugin(
  equalityChecker: (initialValue: any, value: any) => boolean = isDeepEqual
): Plugin<ResetMixin> {
  let controllerMap: WeakMap<Field, FieldController>;

  return (field, accessor, notify) => {
    controllerMap ||= new WeakMap();

    if (controllerMap.has(field)) {
      return;
    }

    const controller: FieldController = {
      _parent: null,
      _children: null,
      _field: field,
      _key: field.key,
      _isDirty: false,
      _initialValue: field.value,
      _accessor: accessor,
      _equalityChecker: equalityChecker,
      _notify: notify,
    };

    controllerMap.set(field, controller);

    if (field.parent !== null) {
      const parent = controllerMap.get(field.parent)!;

      controller._parent = parent;
      controller._initialValue = accessor.get(parent._initialValue, controller._key);

      (parent._children ||= []).push(controller);
    }

    Object.defineProperties(field, {
      isDirty: { enumerable: true, get: () => controller._isDirty },
      initialValue: { enumerable: true, get: () => controller._initialValue },
    });

    field.setInitialValue = value => {
      applyInitialValue(controller, value);
    };

    field.reset = () => {
      controller._field.setValue(controller._initialValue);
    };

    field.subscribe(() => {
      applyDirty(controller);
    });

    applyDirty(controller);
  };
}

interface FieldController {
  _parent: FieldController | null;
  _children: FieldController[] | null;
  _field: Field;
  _key: unknown;
  _isDirty: boolean;
  _initialValue: unknown;
  _accessor: Accessor;
  _equalityChecker: (initialValue: any, value: any) => boolean;
  _notify: () => void;
}

function applyDirty(controller: FieldController): void {
  controller._isDirty = !controller._equalityChecker(controller._initialValue, controller._field.value);
}

function applyInitialValue(controller: FieldController, initialValue: unknown): void {
  if (isEqual(controller._initialValue, initialValue)) {
    return;
  }

  let rootController = controller;

  while (rootController._parent !== null) {
    const { _key } = rootController;
    rootController = rootController._parent;
    initialValue = controller._accessor.set(rootController._initialValue, _key, initialValue);
  }

  callAll(propagateInitialValue(controller, rootController, initialValue, []));
}

function propagateInitialValue(
  targetController: FieldController,
  controller: FieldController,
  initialValue: unknown,
  notifyCallbacks: Array<() => void>
): Array<() => void> {
  notifyCallbacks.push(controller._notify);

  controller._initialValue = initialValue;

  applyDirty(controller);

  if (controller._children !== null) {
    for (const child of controller._children) {
      const childInitialValue = controller._accessor.get(initialValue, child._key);

      if (child !== targetController && isEqual(child._initialValue, childInitialValue)) {
        continue;
      }
      propagateInitialValue(targetController, child, childInitialValue, notifyCallbacks);
    }
  }

  return notifyCallbacks;
}
