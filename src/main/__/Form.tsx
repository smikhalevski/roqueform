import React, {ReactElement, Ref, SetStateAction, useImperativeHandle} from 'react';
import {Narrowed, ObjectPath, PropertyKey, ValueAtKey, ValueAtPath} from '../hook-types';
import {useForm} from './useForm';
import {useEffectOnce} from 'react-hookers';
import {useEvent} from './useEvent';

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

export interface FormOptions {
  eager?: boolean;
}

export function Form<V>(props: {
  initialValue: V;
  upstream?: never;
  accessor?: never;
  children: (form: Form<any, V>) => ReactElement;
  onChange?: (value: V) => void;
}): ReactElement;

export function Form<V = any>(props: {
  initialValue?: V;
  upstream?: never;
  accessor?: never;
  children: (form: Form<any, V | undefined>) => ReactElement;
  onChange?: (value: V | undefined) => void;
}): ReactElement;

export function Form<U>(props: {
  upstream: Form<any, U>;
  accessor?: never;
  children: (form: Form<U, U>) => ReactElement;
  onChange?: (value: U) => void;
}): ReactElement;

export function Form<U, K extends PropertyKey<U>>(props: {
  upstream: Form<any, U>;
  accessor: Narrowed<K>;
  children: (form: Form<U, ValueAtKey<U, K>>) => ReactElement;
  onChange?: (value: ValueAtKey<U, K>) => void;
}): ReactElement;

export function Form<U, P extends ObjectPath<U> & unknown[]>(props: {
  upstream: Form<any, U>;
  accessor: Narrowed<P>;
  children: (form: Form<U, ValueAtPath<U, P>>) => ReactElement;
  onChange?: (value: ValueAtPath<U, P>) => void;
}): ReactElement;

export function Form<U, V>(props: {
  upstream: Form<any, U>;
  accessor: Accessor<U, V>;
  children: (form: Form<U, V>) => ReactElement;
  onChange?: (value: V) => void;
}): ReactElement;

export function Form(props: any): ReactElement {
  const form = useForm(props.upstream, props.accessor, props);

  const handleChange = useEvent(props.onChange);

  useEffectOnce(() => form.subscribe(handleChange));

  return props.children(form);
}
