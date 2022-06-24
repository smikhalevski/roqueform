import {Enhancer, Field} from '../Field';
import {createRef, RefObject} from 'react';

export interface WithRef<T> {
  ref: RefObject<T>;
}

export function withRef<T = any>(): Enhancer<WithRef<T>> {
  return (field) => Object.assign<Field, WithRef<T>>(field, {ref: createRef()});
}
