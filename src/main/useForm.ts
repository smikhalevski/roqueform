import {Narrowed, ObjectPath, PropertyKey, ValueAtKey, ValueAtPath} from './hook-types';
import {useEffectOnce, useRerender} from 'react-hookers';
import {EffectCallback, useRef} from 'react';
import {Accessor, Form, FormOptions} from './Form';
import {createFormController, disposeFormController, isForm} from './createFormController';

export function useForm<V>(): Form<any, V | undefined>;

export function useForm<V>(initialValue: V | (() => V)): Form<any, V>;

export function useForm<U>(upstream: Form<any, U>): Form<U, U>;

export function useForm<U>(upstream: Form<any, U> | null | undefined): Form<U | undefined, U>;

export function useForm<U, K extends PropertyKey<U>>(upstream: Form<any, U>, accessor: Narrowed<K>, options?: FormOptions): Form<U, ValueAtKey<U, K>>;

export function useForm<U, P extends ObjectPath<U> & unknown[]>(upstream: Form<any, U>, accessor: Narrowed<P>, options?: FormOptions): Form<U, ValueAtPath<U, P>>;

export function useForm<U, V>(upstream: Form<any, U>, accessor: Accessor<U, V>, options?: FormOptions): Form<U, V>;

export function useForm<U, V>(upstream: Form<any, U> | null | undefined, accessor: Accessor<U | undefined, V>, options?: FormOptions): Form<U | undefined, V>;

export function useForm(initialValueOrUpstream?: unknown, accessorLike?: unknown, options?: FormOptions) {

  const rerender = useRerender();
  const manager = useRef<ReturnType<typeof createFormManager>>().current ||= createFormManager(rerender, initialValueOrUpstream, accessorLike, options);

  useEffectOnce(manager.__effect);

  return manager.__form;
}

function createFormManager(rerender: () => void, initialValueOrUpstream?: unknown, accessorLike?: unknown, options?: FormOptions) {

  const controller = createFormController(isForm(initialValueOrUpstream) ? initialValueOrUpstream : null, accessorLike, options);

  const __effect: EffectCallback = () => {
    const unsubscribe = controller.__eventBus.subscribe(rerender);

    return () => {
      unsubscribe();
      disposeFormController(controller);
    };
  };

  return {
    __form: controller.__form,
    __effect,
  };
}
