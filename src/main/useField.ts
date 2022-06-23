import {useContext, useRef} from 'react';
import {AccessorContext} from './AccessorContext';
import {createField} from './createField';
import {callOrGet} from './utils';
import {Enhancer, Field} from './Field';

export function useField<T = any>(): Field<T | undefined>;

export function useField<T>(initialValue: T | (() => T)): Field<T>;

export function useField<T, M>(initialValue: T | (() => T), enhancer: Enhancer<M>): Field<T, M> & M;

export function useField<T, M>(initialValue?: T | (() => T), enhancer?: Enhancer<M>): Field<T, M> & M {
  const accessor = useContext(AccessorContext);

  return useRef<Field<T, M> & M>().current ||= createField(accessor, callOrGet(initialValue), enhancer);
}
