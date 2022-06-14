import {EffectCallback} from 'react';
import {Accessor, Form} from './Form';
import {callOrGet, die} from '../utils';
import {EventBus} from '@smikhalevski/event-bus';

export interface FormManager<U, V> {
  __form: Form<U, V>;
  __value: V;
  __staged: boolean;
  __touched: boolean;
  __eager: boolean;
  __accessor: Accessor<U | undefined, V> | null;
  __eventBus: EventBus<V>;
  __upstream: FormManager<any, U> | null;
  __downstream: FormManager<V, any>[] | null;
  __managerMap: FormManagerMap;
}

export type FormManagerMap = WeakMap<Form<any, any>, FormManager<any, any>>;

export function createFormManager<U, V>(managerMap: FormManagerMap, upstream: Form<any, U> | null, accessor: Accessor<U | undefined, V> | null, eager: boolean): FormManager<U, V> {

  const upstreamManager = upstream !== null ? managerMap.get(upstream) || die('Unmounted form cannot be used as an upstream') : null;

  const upstreamValue = upstreamManager?.__value;

  const value = accessor !== null ? accessor.get(upstreamValue) : upstreamValue;

  const eventBus = new EventBus<V>();

  const __form: Form<U, V> = {
    upstream,
    value,
    staged: false,
    touched: false,

    setValue(value) {
      dispatchUpdate(manager, callOrGet(value, manager.__value), false);
    },
    stageValue(value) {
      dispatchUpdate(manager, callOrGet(value, manager.__value), true);
    },
    pushToUpstream() {
      dispatchUpdate(manager, manager.__value, false);
    },
    subscribe(listener) {
      return eventBus.subscribe(listener);
    },
  };

  const manager: FormManager<U, V> = {
    __form,
    __value: value,
    __staged: false,
    __touched: false,
    __eager: eager,
    __accessor: accessor,
    __eventBus: eventBus,
    __upstream: upstreamManager,
    __downstream: null,
    __managerMap: managerMap,
  };

  if (upstreamManager !== null) {
    const downstream = upstreamManager.__downstream ||= [];
    downstream.push(manager);
  }

  managerMap.set(__form, manager);

  return manager;
}

export function applyUpdate(manager: FormManager<any, any>): void {
  const {__form} = manager;

  __form.value = manager.__value;
  __form.staged = manager.__staged;
  __form.touched = manager.__touched;
}

export function disposeManager(manager: FormManager<any, any>): void {
  const {__form} = manager;

  manager.__upstream?.__downstream?.splice(manager.__upstream.__downstream.indexOf(manager));

  manager.__downstream?.forEach(disposeManager);

  __form.upstream = manager.__upstream = manager.__downstream = null;
  __form.setValue = __form.stageValue = __form.pushToUpstream = disposedCallback;

  manager.__managerMap.delete(__form);
}

function disposedCallback(): void {
  if (process.env.NODE_ENV !== 'production') {
    console.error('Can\'t perform an update on an unmounted form. This is a no-op, but it indicates a memory leak in your application.');
  }
}

function dispatchUpdate(manager: FormManager<any, any>, value: unknown, staged: boolean): void {
  manager.__staged = staged;
  manager.__touched = true;

  if (Object.is(value, manager.__value)) {
    // Unchanged value
    return;
  }

  const originator = manager;

  while (manager.__upstream !== null && !manager.__staged) {
    const {__accessor} = manager;
    manager = manager.__upstream;
    value = __accessor !== null ? __accessor.set(manager.__value, value) : value;
  }

  propagateUpdate(originator, manager, value);
}

function propagateUpdate(originator: FormManager<unknown, unknown>, manager: FormManager<unknown, unknown>, value: unknown): void {

  if (Object.is(value, manager.__value)) {
    // Unchanged value
    return;
  }

  manager.__value = value;

  if (manager.__downstream !== null) {
    for (const downstreamManager of manager.__downstream) {
      if (downstreamManager.__staged) {
        continue;
      }
      const {__accessor} = downstreamManager;
      propagateUpdate(originator, manager, __accessor !== null ? __accessor.get(value) : value);
    }
  }

  if (manager === originator || manager.__eager) {
    manager.__eventBus.publish(value);
  }
}
