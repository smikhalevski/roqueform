import {KeyOf, Narrowed, ObjectPath, ValueAtKey, ValueAtPath} from './object-types';
import {useEffectOnce, useRerender} from 'react-hookers';
import {EffectCallback, useContext, useRef} from 'react';
import {Accessor, Form} from './Form';
import {createFormController, FormController, isControlledForm, unmountFormController} from './createFormController';
import {AccessorFactory, AccessorFactoryContext} from './AccessorFactoryContext';

export function useForm<V>(): Form<V | undefined>;

export function useForm<V>(initialValue: V | (() => V)): Form<V>;

export function useForm<U>(parent: Form<U>): Form<U>;

export function useForm<U>(parent: Form<U> | null | undefined): Form<U | undefined>;

export function useForm<U, K extends KeyOf<U> & keyof any>(parent: Form<U>, accessor: Narrowed<K>): Form<ValueAtKey<U, K>>;

export function useForm<U, P extends ObjectPath<U> & unknown[]>(parent: Form<U>, accessor: Narrowed<P>): Form<ValueAtPath<U, P>>;

export function useForm<U, V>(parent: Form<U>, accessor: Accessor<U, V>): Form<V>;

export function useForm<U, V>(parent: Form<U> | null | undefined, accessor: Accessor<U | undefined, V>): Form<V>;

export function useForm(origin?: unknown, accessorOrPath?: unknown) {

  const accessorFactory = useContext(AccessorFactoryContext);
  const rerender = useRerender();
  const manager = useRef<ReturnType<typeof createFormManager>>().current ||= createFormManager(rerender, origin, accessorOrPath, accessorFactory);

  useEffectOnce(manager.__effect);

  return manager.__form;
}

function createFormManager(rerender: () => void, origin: unknown, accessorOrPath: unknown, accessorFactory: AccessorFactory) {

  let controller: FormController;

  if (isControlledForm(origin)) {
    const accessor = Array.isArray(accessorOrPath) ? accessorFactory(accessorOrPath) : accessorOrPath === null || typeof accessorOrPath !== 'object' ? accessorFactory([accessorOrPath]) : accessorOrPath as Accessor<unknown, unknown> || null;
    controller = createFormController(rerender, origin, accessor);
  } else {
    controller = createFormController(rerender, null, null);
    controller.__value = origin;
  }

  const __effect: EffectCallback = () => () => unmountFormController(controller);

  return {
    __form: controller.__form,
    __effect,
  };
}
