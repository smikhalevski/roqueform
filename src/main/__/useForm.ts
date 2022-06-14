import {Key, Narrowed, Path, ValueAtKey, ValueAtPath} from '../hook-types';
import {useEffectOnce, useRerender} from 'react-hookers';
import {useRef} from 'react';
import {Accessor, Form} from './Form';
import {applyUpdate, createFormManager, disposeManager, FormManager, FormManagerMap} from './createFormManager';

const managerMap: FormManagerMap = new WeakMap();

export function useForm<U>(upstream: Form<any, U>): Form<U, U>;

export function useForm<U, K extends Key<U> & keyof any>(upstream: Form<any, U>, key: Narrowed<K>, eager?: boolean): Form<U, ValueAtKey<U, K>>;

export function useForm<U, P extends Path<U> & unknown[]>(upstream: Form<any, U>, path: Narrowed<P>, eager?: boolean): Form<U, ValueAtPath<U, P>>;

export function useForm<U, V>(upstream: Form<any, U>, accessor: Accessor<U, V>, eager?: boolean): Form<U, V>;

export function useForm<U, V>(upstream: Form<any, U> | undefined, accessor: Accessor<U | undefined, V>, eager?: boolean): Form<U | undefined, V>;

export function useForm<V>(initialValue: V | (() => V)): Form<any, V>;

export function useForm<V>(initialValue?: V | (() => V)): Form<any, V | undefined>;

export function useForm(upstream?: any, accessor?: any, eager = false): Form<any, any> {

  const rerender = useRerender();
  const manager = useRef<FormManager<any, any>>().current ||= createFormManager(managerMap, upstream, accessor, eager);

  useEffectOnce(() => {
    const unsubscribe = manager.__eventBus.subscribe(rerender);
    return () => {
      unsubscribe();
      disposeManager(manager);
    };
  });

  applyUpdate(manager);

  return manager.__form;
}
