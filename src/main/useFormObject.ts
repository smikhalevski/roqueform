import {EffectCallback, useRef} from 'react';
import {useEffectOnce, useRerender} from 'react-hookers';
import {Accessor, FormObject} from './FormObject';
import {Key, Narrowed, Path, ValueAtKey, ValueAtPath} from './hook-types';

export function useFormObject<U>(upstream: FormObject<any, U>): FormObject<U, U>;

export function useFormObject<U, K extends Key<U> & keyof any>(upstream: FormObject<any, U>, key: Narrowed<K>, transient?: boolean): FormObject<U, ValueAtKey<U, K>>;

export function useFormObject<U, P extends Path<U> & unknown[]>(upstream: FormObject<any, U>, path: Narrowed<P>, transient?: boolean): FormObject<U, ValueAtPath<U, P>>;

export function useFormObject<U, V>(upstream: FormObject<any, U>, accessor: Accessor<U, V>, transient?: boolean): FormObject<U, V>;

export function useFormObject<U, V>(upstream: FormObject<any, U> | undefined, accessor: Accessor<U | undefined, V>, transient?: boolean): FormObject<U | undefined, V>;

export function useFormObject<V>(initialValue?: V | (() => V)): FormObject<any, V | undefined>;

export function useFormObject<V>(initialValue: V | (() => V)): FormObject<any, V>;

export function useFormObject(upstream?: any, accessor?: any, transient?: boolean): FormObject<any> {

  const rerender = useRerender();
  const manager = useRef<ReturnType<typeof createFormObjectManager>>().current ||= createFormObjectManager(rerender, upstream, accessor, transient);

  useEffectOnce(manager.__effect);

  return manager.__formObject;
}

function createFormObjectManager(listener: () => void, upstream: unknown, discriminant: Accessor<any, any> | keyof any, transient?: boolean) {

  let __formObject: FormObject<any>;

  if (upstream instanceof FormObject) {
    const accessor = undefined;
    // const accessor = discriminant === undefined ? undefined : Array.isArray(discriminant) ? undefined : discriminant !== null && typeof discriminant === 'object' ? discriminant : createPropertyAccessor(discriminant);
    __formObject = new FormObject(listener, upstream, accessor, transient);
  } else {
    __formObject = new FormObject(listener, undefined, undefined, transient);
    __formObject.value = upstream;
  }

  const __effect: EffectCallback = () => () => __formObject.detach();

  return {
    __formObject,
    __effect,
  };
}
