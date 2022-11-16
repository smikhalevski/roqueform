import { useContext, useRef } from 'react';
import { AccessorContext } from './AccessorContext';
import { createField } from './createField';
import { callOrGet } from './utils';
import { Field, Plugin } from './Field';

/**
 * Creates the new field.
 *
 * @returns The `Field` instance.
 * @template T The value controlled by the field.
 */
export function useField<T = any>(): Field<T | undefined>;

/**
 * Creates the new field.
 *
 * @param initialValue The initial value assigned to the field.
 * @returns The `Field` instance.
 * @template T The value controlled by the field.
 */
export function useField<T>(initialValue: T | (() => T)): Field<T>;

/**
 * Creates the new field enhanced by a plugin.
 *
 * @param initialValue The initial value assigned to the field.
 * @param plugin Enhances the field with additional functionality.
 * @returns The `Field` instance.
 * @template T The value controlled by the field.
 * @template P The enhancement added by the plugin.
 */
export function useField<T, P>(initialValue: T | (() => T), plugin: Plugin<T, P>): Field<T, P> & P;

export function useField(initialValue?: unknown, plugin?: Plugin<unknown, unknown>) {
  const accessor = useContext(AccessorContext);

  return (useRef<Field>().current ||= createField(accessor, callOrGet(initialValue), plugin!));
}
