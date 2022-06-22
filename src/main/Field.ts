import {ReactElement, SetStateAction, useEffect} from 'react';
import {useHandler, useRerender} from 'react-hookers';
import {callOrGet} from './utils';

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

  subscribe(listener: (notifiedField: Field<any>) => void): () => void;
}

export interface FieldProps<T> {
  field: Field<T>;
  children: ((field: Field<T>) => ReactElement<any, any>) | ReactElement<any, any>;
  onChange?: (value: T) => void;
}

export function Field<T>(props: FieldProps<T>): ReactElement<any, any> {
  const {field} = props;
  const rerender = useRerender();
  const handleChange = useHandler(props.onChange);

  useEffect(() => field.subscribe((notifiedField) => {
    if (field === notifiedField) {
      rerender();
    }
    if (!field.transient) {
      handleChange(field.value);
    }
  }), [field]);

  return callOrGet(props.children, field);
}
