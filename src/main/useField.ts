import { useContext, useRef } from 'react';
import { AccessorContext } from './AccessorContext';
import { createField } from './createField';
import { callOrGet } from './utils';
import { Enhancer, Field } from './Field';

/**
 * Creates the new field instance.
 *
 * @returns The `Field` instance.
 *
 * @template T The type of the value held by the field.
 */
export function useField<T = any>(): Field<T | undefined>;

/**
 * Creates the new field instance.
 *
 * @param initialValue The initial value assigned to the field.
 * @returns The `Field` instance.
 *
 * @template T The type of the value held by the field.
 */
export function useField<T>(initialValue: T | (() => T)): Field<T>;

/**
 * Creates the new enhanced field instance.
 *
 * @param initialValue The initial value assigned to the field.
 * @param enhancer Enhances the field with additional functionality.
 * @returns The `Field` instance.
 *
 * @template T The type of the value held by the field.
 * @template M The type of mixin added by the enhancer.
 */
export function useField<T, M>(initialValue: T | (() => T), enhancer: Enhancer<M>): Field<T, M> & M;

export function useField<T, M>(initialValue?: T | (() => T), enhancer?: Enhancer<M>): Field<T, M> & M {
  const accessor = useContext(AccessorContext);

  return (useRef<Field<T, M> & M>().current ||= createField(accessor, callOrGet(initialValue), enhancer));
}
