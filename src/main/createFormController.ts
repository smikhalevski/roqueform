import {Accessor, Form} from './Form';
import {callOrGet} from './utils';
import {EventBus} from '@smikhalevski/event-bus';

const FORM_CONTROLLER_SYMBOL = Symbol('controller');

export interface FormController {
  __form: ControlledForm;
  __value: unknown;
  __staged: boolean;
  __accessor: Accessor<unknown, unknown> | null;
  __rerender: () => void;
  __eventBus: EventBus<Form<unknown>>;
  __parent: FormController | null;
  __children: FormController[] | null;
  __mounted: boolean;
}

export interface ControlledForm extends Form<any> {
  [FORM_CONTROLLER_SYMBOL]: FormController;
}

export function isControlledForm(value: any): value is ControlledForm {
  return value?.[FORM_CONTROLLER_SYMBOL]?.__form === value;
}

export function createFormController(rerender: () => void, parent: ControlledForm | null, accessor: Accessor<any, any> | null): FormController {

  const parentController = parent !== null ? parent[FORM_CONTROLLER_SYMBOL] : null;
  const parentValue = parentController?.__value;

  if (process.env.NODE_ENV !== 'production') {
    if (parentController !== null && !parentController.__mounted) {
      console.error('The unmounted form won\'t receive updates when used as a parent.');
    }
  }

  const value = accessor !== null ? accessor.get(parentValue) : parentValue;

  const eventBus = new EventBus<Form<unknown>>();

  const form: Form<unknown> = {
    value,
    staged: false,
    touched: false,

    setValue(value) {
      dispatchUpdate(controller, callOrGet(value, controller.__value), false);
    },
    stageValue(value) {
      dispatchUpdate(controller, callOrGet(value, controller.__value), true);
    },
    commit() {
      dispatchUpdate(controller, controller.__value, false);
    },
    subscribe(listener) {
      return eventBus.subscribe(listener);
    },
  };

  const controller: FormController = {
    __form: form as ControlledForm,
    __value: value,
    __staged: false,
    __accessor: accessor,
    __eventBus: eventBus,
    __parent: parentController,
    __children: null,
    __mounted: true,
    __rerender: rerender,
  };

  Object.defineProperty(form, FORM_CONTROLLER_SYMBOL, {value: controller});

  if (parentController !== null) {
    const parentChildren = parentController.__children ||= [];
    parentChildren.push(controller);
  }

  return controller;
}

export function unmountFormController(controller: FormController): void {
  controller.__mounted = false;
  controller.__parent?.__children?.splice(controller.__parent.__children.indexOf(controller));
  controller.__children?.forEach(unmountFormController);
  controller.__parent = controller.__children = null;
}

function dispatchUpdate(controller: FormController, value: unknown, staged: boolean): void {
  if (!controller.__mounted) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Can\'t perform an update on the unmounted form.');
    }
    return;
  }

  controller.__form.staged = controller.__staged = staged;
  controller.__form.touched = true;

  if (Object.is(value, controller.__value)) {
    return;
  }

  let rootController = controller;

  while (rootController.__parent !== null && rootController.__parent.__mounted && !rootController.__staged) {
    const {__accessor} = rootController;
    rootController = rootController.__parent;
    value = __accessor !== null ? __accessor.set(rootController.__value, value) : value;
  }

  propagateUpdate(rootController, value);

  controller.__rerender();
}

function propagateUpdate(controller: FormController, value: unknown): void {
  if (Object.is(value, controller.__value)) {
    return;
  }

  if (controller.__children !== null) {
    for (const childController of controller.__children) {
      if (childController.__staged) {
        continue;
      }
      const {__accessor} = childController;
      propagateUpdate(childController, __accessor !== null ? __accessor.get(value) : value);
    }
  }

  controller.__form.value = controller.__value = value;
  controller.__eventBus.publish(controller.__form);
}
