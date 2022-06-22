import {useContext, useRef} from 'react';
import {AccessorContext} from './AccessorContext';
import {createField} from './createField';
import {callOrGet} from './utils';
import {Field} from './Field';

export function useField<T>(initialValue: T | (() => T)): Field<T> {
  const accessor = useContext(AccessorContext);

  return useRef<Field<T>>().current ||= createField(accessor, callOrGet(initialValue));
}
