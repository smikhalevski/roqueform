import {Accessor, FormObject} from './FormObject';
import {Key, Path} from './hook-types';
import React, {ReactElement, ReactNode} from 'react';
import {useFormObject} from './useFormObject';

export interface FormProps<U, V> {
  upstream?: FormObject<any, U>;
  accessor?: Accessor<U, V> | Key<U> | Path<U>;
  transient?: boolean;
  children: (formObject: FormObject<U, V>) => ReactNode;
}

export function Form<U, V = U>(props: FormProps<U, V>): ReactElement {
  return <>{props.children(useFormObject(props.upstream, props.accessor as any, props.transient) as any)}</>
}
