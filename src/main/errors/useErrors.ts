import {Errors} from './Errors';
import {useRef} from 'react';

export function useErrors<T>(): Errors<T> {
  return useRef<Errors<T>>().current ||= new Errors<T>();
}
