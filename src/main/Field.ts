import {ReactElement, SetStateAction, useEffect} from 'react';
import {useHandler, useRerender} from 'react-hookers';
import {callOrGet} from './utils';

export interface Accessor {

  get(obj: any, key: any): any;

  set(obj: any, key: any, value: any): any;
}

export interface Field<T = any> {
  value: T;
  transient: boolean;

  dispatchValue(value: SetStateAction<T>): void;

  setValue(value: SetStateAction<T>): void;

  dispatch(): void;

  at<K extends keyof T>(key: K): Field<T[K]>;

  subscribe(listener: (targetField: Field) => void): () => void;

  notify(): void;
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

  useEffect(() => {

    let prevValue: T | undefined;

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

  return callOrGet(props.children, field);
}
