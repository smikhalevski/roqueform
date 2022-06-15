import {ReactElement, SetStateAction} from 'react';
import {useEffectOnce, useHandler} from 'react-hookers';
import {KeyOf, Narrowed, ObjectPath, ValueAtKey, ValueAtPath} from './object-types';
import {useForm} from './useForm';

export interface Form<V> {
  value: V;
  staged: boolean;
  touched: boolean;

  setValue(value: SetStateAction<V>): void;

  stageValue(value: SetStateAction<V>): void;

  commit(): void;

  subscribe(listener: (form: this) => void): () => void;
}

export interface Accessor<U, V> {

  get(parentValue: U): V;

  set(parentValue: U, value: V): U;
}

export function Form<V>(props: {
  initialValue: V | (() => V);
  children: (form: Form<V>) => ReactElement<any, any>;
  onChange?: (value: V) => void;
}): ReactElement<any, any>;

export function Form<V = any>(props: {
  // parent?: never;
  initialValue?: V | (() => V);
  children: (form: Form<V | undefined>) => ReactElement<any, any>;
  onChange?: (value: V | undefined) => void;
}): ReactElement<any, any>;

export function Form<U>(props: {
  parent: Form<U>;
  children: (form: Form<U>) => ReactElement<any, any>;
  onChange?: (value: U) => void;
}): ReactElement<any, any>;

export function Form<U, K extends KeyOf<U> & keyof any>(props: {
  parent: Form<U>;
  accessor: Narrowed<K>;
  children: (form: Form<ValueAtKey<U, K>>) => ReactElement<any, any>;
  onChange?: (value: ValueAtKey<U, K>) => void;
}): ReactElement<any, any>;

export function Form<U, P extends ObjectPath<U> & unknown[]>(props: {
  parent: Form<U>;
  accessor: Narrowed<P>;
  children: (form: Form<ValueAtPath<U, P>>) => ReactElement<any, any>;
  onChange?: (value: ValueAtPath<U, P>) => void;
}): ReactElement<any, any>;

export function Form<U, V>(props: {
  parent: Form<U>;
  accessor: Accessor<U, V>;
  children: (form: Form<V>) => ReactElement<any, any>;
  onChange?: (value: V) => void;
}): ReactElement<any, any>;

export function Form(props: any) {
  const {initialValue} = props;

  const form = useForm(initialValue !== undefined ? initialValue : props.parent, props.accessor);

  const handleChange = useHandler(props.onChange);

  useEffectOnce(() => form.subscribe((form) => handleChange(form.value)));

  return props.children(form);
}
