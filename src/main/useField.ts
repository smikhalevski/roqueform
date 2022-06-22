import {useContext, useRef} from 'react';
import {AccessorContext} from './AccessorContext';
import {createField} from './createField';
import {callOrGet} from './utils';
import {Enhancer, Field} from './Field';

export function useField<V, E = {}>(initialValue: V | (() => V), enhancer?: Enhancer<E>): Field<V, E> & E {
  const accessor = useContext(AccessorContext);

  return useRef<Field<V, E> & E>().current ||= createField(accessor, callOrGet(initialValue), enhancer);
}
