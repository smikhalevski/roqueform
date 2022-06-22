import {useContext, useRef} from 'react';
import {AccessorContext} from './AccessorContext';
import {useEffectOnce, useRerender} from 'react-hookers';
import {createField, isField} from './createField';
import {callOrGet} from './utils';
import {Field} from './Field';

export function useField<T>(initialValue: T | (() => T) | Field<T>): Field<T> {

  const accessor = useContext(AccessorContext);
  const rerender = useRerender();

  const field = useRef<Field<any>>().current ||= isField(initialValue) ? initialValue : createField(accessor, callOrGet(initialValue));

  useEffectOnce(() => field.subscribe((originator) => {
    if (originator === field) {
      rerender();
    }
  }));

  return field;
}
