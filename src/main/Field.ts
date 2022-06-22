import {ReactElement, SetStateAction} from 'react';
import {useEffectOnce, useHandler} from 'react-hookers';
import {useField} from './useField';

export interface Accessor {

  get(obj: any, key: any): any;

  set(obj: any, key: any, value: any): any;
}

export interface Field<T> {
  value: T;
  transient: boolean;

  dispatchValue(value: SetStateAction<T>): void;

  setValue(value: SetStateAction<T>): void;

  dispatch(): void;

  at<K extends keyof T>(key: K): Field<T[K]>;

  subscribe(listener: (originator: Field<any>) => void): () => void;
}

export interface FieldProps<T> {
  initialValue: T | (() => T) | Field<T>;
  children: (field: Field<T>) => ReactElement<any, any>;
  onChange?: (value: T) => void;
}

export function Field<T>(props: FieldProps<T>): ReactElement<any, any> {
  const field = useField(props.initialValue);
  const handleChange = useHandler(props.onChange);

  useEffectOnce(() => field.subscribe(() => {
    if (!field.transient) {
      handleChange(field.value);
    }
  }));

  return props.children(field);
}
