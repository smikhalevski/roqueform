import {Accessor, Form, FormOptions} from './Form';
import {callOrGet, die} from './utils';
import {EventBus} from '@smikhalevski/event-bus';

const FORM_CONTROLLER_SYMBOL = Symbol('controller');

export interface FormController {
  __form: Form<unknown, unknown>;
  __value: unknown;
  __staged: boolean;
  __eager: boolean;
  __accessor: Accessor<unknown, unknown> | null;
  __eventBus: EventBus<unknown>;
  __upstream: FormController | null;
  __downstream: FormController[] | null;
  __disposed: boolean;
}

export function createFormController(upstream: Form<unknown, unknown> | null, accessor: Accessor<unknown, unknown> | null, options: FormOptions = {}): FormController {

  const {eager = false} = options;

  const upstreamController = isForm(upstream) ? upstream[FORM_CONTROLLER_SYMBOL] : null;
  const upstreamValue = upstreamController?.__value;

  if (upstreamController?.__disposed) {
    die('Cannot use ')
  }

  const value = accessor !== null ? accessor.get(upstreamValue) : upstreamValue;

  const eventBus = new EventBus<unknown>();

  const __form: Form<unknown, unknown> = {
    upstream,
    value,
    staged: false,
    touched: false,

    setValue(value) {
      dispatchUpdate(controller, callOrGet(value, controller.__value), false);
    },
    stageValue(value) {
      dispatchUpdate(controller, callOrGet(value, controller.__value), true);
    },
    pushToUpstream() {
      dispatchUpdate(controller, controller.__value, false);
    },
    subscribe(listener) {
      return eventBus.subscribe(listener);
    },
  };

  const controller: FormController = {
    __form,
    __value: value,
    __staged: false,
    __eager: eager,
    __accessor: accessor,
    __eventBus: eventBus,
    __upstream: upstreamController,
    __downstream: null,
    __disposed: false,
  };

  // Connect controller to the upstream
  if (upstreamController !== null) {
    const downstream = upstreamController.__downstream ||= [];
    downstream.push(controller);
  }

  // Make controller accessible from form
  Object.defineProperty(__form, FORM_CONTROLLER_SYMBOL, {
    get() {
      return controller;
    },
  });

  return controller;
}

export function isForm(value: unknown): value is Form<unknown, unknown> & { [FORM_CONTROLLER_SYMBOL]: FormController } {
  return value !== null && typeof value === 'object' && value.hasOwnProperty(FORM_CONTROLLER_SYMBOL);
}

export function disposeFormController(controller: FormController): void {

  controller.__disposed = true;
  controller.__upstream?.__downstream?.splice(controller.__upstream.__downstream.indexOf(controller));
  controller.__downstream?.forEach(disposeFormController);

  const {__form} = controller;
  __form.upstream = controller.__upstream = controller.__downstream = null;
  __form.setValue = __form.stageValue = __form.pushToUpstream = disposedCallback;
}

function disposedCallback(): void {
  if (process.env.NODE_ENV !== 'production') {
    console.error('Can\'t perform an update on an unmounted form. This is a no-op, but it indicates a memory leak in your application.');
  }
}

function dispatchUpdate(controller: FormController, value: unknown, staged: boolean): void {
  controller.__form.staged = controller.__staged = staged;
  controller.__form.touched = true;

  if (Object.is(value, controller.__value)) {
    return;
  }

  const originator = controller;

  while (controller.__upstream !== null && !controller.__staged) {
    const {__accessor} = controller;
    controller = controller.__upstream;
    value = __accessor !== null ? __accessor.set(controller.__value, value) : value;
  }

  propagateUpdate(originator, controller, value);
}

function propagateUpdate(originator: FormController, controller: FormController, value: unknown): void {

  if (Object.is(value, controller.__value)) {
    return;
  }

  controller.__form.value = controller.__value = value;

  if (controller.__downstream !== null) {
    for (const downstreamController of controller.__downstream) {
      if (downstreamController.__staged) {
        continue;
      }
      const {__accessor} = downstreamController;
      propagateUpdate(originator, controller, __accessor !== null ? __accessor.get(value) : value);
    }
  }

  if (controller === originator || controller.__eager) {
    controller.__eventBus.publish(value);
  }
}
