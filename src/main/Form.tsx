import {Accessor, FormObject} from './FormObject';
import {Key, Narrowed, Path, ValueAtKey, ValueAtPath} from './hook-types';
import React, {ReactElement, ReactNode} from 'react';
import {useFormObject} from './useFormObject';

interface FormProps {
  upstream?: FormObject<any, any>;
  accessor?: any;
  transient?: boolean;
  children: (formObject: FormObject<any, any>) => ReactNode;
}

export function Form<U>(props: { upstream: FormObject<any, U>, children: (formObject: FormObject<U, U>) => ReactNode }): ReactElement;

export function Form<U, V>(props: { upstream: FormObject<any, U>, accessor: Accessor<U, V>, transient?: boolean, children: (formObject: FormObject<U, V>) => ReactNode }): ReactElement;

export function Form<U, V>(props: { upstream: FormObject<any, U> | undefined, accessor: Accessor<U | undefined, V>, transient?: boolean, children: (formObject: FormObject<U | undefined, V>) => ReactNode }): ReactElement;

export function Form<U, K extends Key<U> & keyof any>(props: { upstream: FormObject<any, U>, accessor: Narrowed<K>, transient?: boolean, children: (formObject: FormObject<U, ValueAtKey<U, K>>) => ReactNode }): ReactElement;

export function Form<U, P extends Path<U> & unknown[]>(props: { upstream: FormObject<any, U>, accessor: Narrowed<P>, transient?: boolean, children: (formObject: FormObject<U, ValueAtPath<U, P>>) => ReactNode }): ReactElement;

export function Form(props: FormProps): ReactElement {
  return <>{props.children(useFormObject(props.upstream, props.accessor, props.transient))}</>;
}
