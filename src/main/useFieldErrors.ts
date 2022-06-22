import {FieldErrors} from './FieldErrors';
import {useRef} from 'react';

export function useFieldErrors<T>(): FieldErrors<T> {
  return useRef<FieldErrors<T>>().current ||= new FieldErrors<T>();
}
