import React, {ReactElement, SetStateAction} from 'react';
import {Key, Narrowed, Path, ValueAtKey, ValueAtPath} from '../hook-types';
import {useForm} from './useForm';
import {useEffectOnce} from 'react-hookers';

export interface Accessor<U, V> {

  get(upstreamValue: U): V;

  set(upstreamValue: U, value: V): U;
}

export interface Form<U, V> {
  upstream: Form<any, U> | null;
  value: V;
  staged: boolean;
  touched: boolean;

  setValue(value: SetStateAction<V>): void;

  stageValue(value: SetStateAction<V>): void;

  pushToUpstream(): void;

  subscribe(listener: (value: V) => void): () => void;
}

export function Form<U>(props: { upstream: Form<any, U>, accessor?: never, eager?: boolean, onChange?: (value: U) => void, children: (form: Form<U, U>) => ReactElement }): ReactElement;

export function Form<U, V>(props: { upstream: Form<any, U>, accessor: Accessor<U, V>, eager?: boolean, onChange?: (value: V) => void, children: (form: Form<U, V>) => ReactElement }): ReactElement;

export function Form<U, V>(props: { upstream: Form<any, U> | undefined, accessor: Accessor<U | undefined, V>, eager?: boolean, onChange?: (value: V) => void, children: (form: Form<U | undefined, V>) => ReactElement }): ReactElement;

export function Form<U, K extends Key<U> & keyof any>(props: { upstream: Form<any, U>, accessor: Narrowed<K>, eager?: boolean, onChange?: (value: ValueAtKey<U, K>) => void, children: (form: Form<U, ValueAtKey<U, K>>) => ReactElement }): ReactElement;

export function Form<U, P extends Path<U> & unknown[]>(props: { upstream: Form<any, U>, accessor: Narrowed<P>, eager?: boolean, onChange?: (value: ValueAtPath<U, P>) => void, children: (form: Form<U, ValueAtPath<U, P>>) => ReactElement }): ReactElement;

export function Form(props: any): ReactElement {
  const form = useForm(props.upstream, props.accessor, props.eager);

  useEffectOnce(() => form.subscribe(props.onChange));

  return props.children(form);
}
