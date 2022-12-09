import { DependencyList, useContext, useMemo } from 'react';
import { AccessorContext } from './AccessorContext';
import { createField } from './createField';
import { Field, Plugin } from './public-types';
import { callOrGet } from './public-utils';

/**
 * Creates the new field.
 *
 * @returns The {@linkcode Field} instance.
 * @template T The value controlled by the field.
 */
export function useField<T = any>(): Field<T | undefined>;

/**
 * Creates the new field.
 *
 * @param initialValue The initial value assigned to the field.
 * @returns The {@linkcode Field} instance.
 * @template T The value controlled by the field.
 */
export function useField<T>(initialValue: T | (() => T)): Field<T>;

/**
 * Creates the new field enhanced by a plugin.
 *
 * @param initialValue The initial value assigned to the field.
 * @param plugin Enhances the field with additional functionality.
 * @param deps The array of dependencies that trigger the field re-instantiation.
 * @returns The {@linkcode Field} instance.
 * @template T The value controlled by the field.
 * @template P The enhancement added by the plugin.
 */
export function useField<T, P>(
  initialValue: T | (() => T),
  plugin: Plugin<T, P>,
  deps?: DependencyList
): Field<T, P> & P;

export function useField(initialValue?: unknown, plugin?: Plugin<unknown, unknown>, deps?: DependencyList) {
  const accessor = useContext(AccessorContext);

  return useMemo(
    () => createField(accessor, callOrGet(initialValue), plugin!),
    deps ? deps.concat(accessor) : [accessor]
  );
}
