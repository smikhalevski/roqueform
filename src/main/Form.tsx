import React, {ReactElement, SetStateAction} from 'react';
import {Narrowed, ObjectPath, PropertyKey, ValueAtKey, ValueAtPath} from './hook-types';
import {useForm} from './useForm';
import {useEffectOnce, useHandler} from 'react-hookers';

export interface FormOptions {
  eager?: boolean;
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

export interface Accessor<U, V> {

  get(upstreamValue: U): V;

  set(upstreamValue: U, value: V): U;
}

export interface FormProps<U, V> extends FormOptions {
  children: (form: Form<U, V>) => ReactElement;
  onChange?: (value: V) => void;
}

export function Form<V>(props: FormProps<any, V> & { initialValue: V | (() => V) }): ReactElement;

export function Form<V = any>(props: FormProps<any, V | undefined> & { initialValue?: V | (() => V) }): ReactElement;

export function Form<U>(props: FormProps<U, U> & { upstream: Form<any, U> }): ReactElement;

export function Form<U, K extends PropertyKey<U>>(props: FormProps<U, ValueAtKey<U, K>> & { upstream: Form<any, U>, accessor: Narrowed<K> }): ReactElement;

export function Form<U, P extends ObjectPath<U> & unknown[]>(props: FormProps<U, ValueAtPath<U, P>> & { upstream: Form<any, U>, accessor: Narrowed<P> }): ReactElement;

export function Form<U, V>(props: FormProps<U, V> & { upstream: Form<any, U>, accessor: Accessor<U, V> }): ReactElement;

export function Form(props: any): ReactElement {
  const {initialValue} = props;

  const form = useForm(initialValue !== undefined ? initialValue : props.upstream, props.accessor, props);

  const handleChange = useHandler(props.onChange);

  useEffectOnce(() => form.subscribe(handleChange));

  return props.children(form);
}
