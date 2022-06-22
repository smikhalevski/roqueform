import {createElement, Fragment, ReactElement, ReactNode, useEffect} from 'react';
import {FieldErrors} from './FieldErrors';
import {Field} from './Field';
import {useRerender} from 'react-hookers';

export interface FieldErrorProps<T> {
  errors: FieldErrors<T>;
  field: Field;
  children: (error: T) => ReactNode;
}

export function FieldError<T>(props: FieldErrorProps<T>): ReactElement<any, any> | null {
  const {errors, field} = props;
  const rerender = useRerender();

  useEffect(() => {
    field.subscribe((targetField) => {
      if (field === targetField) {
        rerender();
      }
    });
  });

  return errors.has(field) ? createElement(Fragment, null, props.children(errors.get(field)!)) : null;
}
