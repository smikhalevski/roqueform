import {createElement, Fragment, ReactElement, ReactNode, SetStateAction, useEffect} from 'react';
import {useHandler, useRerender} from 'react-hookers';
import {callOrGet} from './utils';

export type Enhancer<E1> = <T, E0>(field: Field<T, E0>) => Field<T, E0> & E1;

export interface Accessor {

  get(obj: any, key: any): any;

  set(obj: any, key: any, value: any): any;
}

export interface Field<V = any, E = {}> {
  value: V;
  transient: boolean;

  dispatchValue(value: SetStateAction<V>): void;

  setValue(value: SetStateAction<V>): void;

  dispatch(): void;

  at<K extends keyof V>(key: K): Field<V[K], E> & E;

  subscribe(listener: (targetField: Field<any, E> & E) => void): () => void;

  notify(): void;
}

export interface FieldProps<V, E> {
  field: Field<V, E> & E;
  children: ((field: Field<V, E> & E) => ReactNode) | ReactNode;
  onChange?: (value: V) => void;
}

export function Field<V, E = {}>(props: FieldProps<V, E>): ReactElement {
  const {field} = props;
  const rerender = useRerender();
  const handleChange = useHandler(props.onChange);

  useEffect(() => {

    let prevValue: V | undefined;

    return field.subscribe((targetField) => {

      const {value} = field;

      if (field === targetField) {
        rerender();
      }

      if (field.transient || Object.is(value, prevValue)) {
        return;
      }

      handleChange(value);
      prevValue = value;
    });
  }, [field]);

  return createElement(Fragment, null, callOrGet(props.children, field));
}
