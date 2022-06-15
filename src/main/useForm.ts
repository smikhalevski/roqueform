import {Narrowed, ObjectPath, PropertyKey, ValueAtKey, ValueAtPath} from './hook-types';
import {useEffectOnce, useRerender} from 'react-hookers';
import {EffectCallback, useRef} from 'react';
import {Accessor, Form, FormOptions} from './Form';
import {createFormController, unmountFormController, FormController, isControlledForm} from './createFormController';
import {KeysAccessor} from './KeysAccessor';
import {isObjectLike} from './utils';

export function useForm<V>(): Form<any, V | undefined>;

export function useForm<V>(initialValue: V | (() => V)): Form<any, V>;

export function useForm<U>(upstream: Form<any, U>): Form<U, U>;

export function useForm<U>(upstream: Form<any, U> | null | undefined): Form<U | undefined, U>;

export function useForm<U, K extends PropertyKey<U>>(upstream: Form<any, U>, accessor: Narrowed<K>, options?: FormOptions): Form<U, ValueAtKey<U, K>>;

export function useForm<U, P extends ObjectPath<U> & unknown[]>(upstream: Form<any, U>, accessor: Narrowed<P>, options?: FormOptions): Form<U, ValueAtPath<U, P>>;

export function useForm<U, V>(upstream: Form<any, U>, accessor: Accessor<U, V>, options?: FormOptions): Form<U, V>;

export function useForm<U, V>(upstream: Form<any, U> | null | undefined, accessor: Accessor<U | undefined, V>, options?: FormOptions): Form<U | undefined, V>;

export function useForm(upstreamLike?: unknown, accessorLike?: unknown, options?: FormOptions) {

  const rerender = useRerender();
  const manager = useRef<ReturnType<typeof createFormManager>>().current ||= createFormManager(rerender, upstreamLike, accessorLike, options);

  useEffectOnce(manager.__effect);

  return manager.__form;
}

function createFormManager(rerender: () => void, upstreamLike?: unknown, accessorLike?: unknown, options?: FormOptions) {

  let controller: FormController;

  if (isControlledForm(upstreamLike)) {
    controller = createFormController(upstreamLike, toAccessor(accessorLike), options);
  } else {
    controller = createFormController(null, null, options);
    controller.__value = upstreamLike;
  }

  const __effect: EffectCallback = () => {
    const unsubscribe = controller.__eventBus.subscribe(rerender);

    return () => {
      unsubscribe();
      unmountFormController(controller);
    };
  };

  return {
    __form: controller.__form,
    __effect,
  };
}

function toAccessor(accessorLike: unknown): Accessor<unknown, unknown> | null {
  if (accessorLike === undefined) {
    return null;
  }
  if (Array.isArray(accessorLike)) {
    new KeysAccessor(accessorLike);
  }
  if (isObjectLike(accessorLike)) {
    return accessorLike as Accessor<unknown, unknown>;
  }
  return new KeysAccessor([accessorLike]);
}
