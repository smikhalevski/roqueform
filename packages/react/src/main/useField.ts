import { useContext, useRef } from 'react';
import { callOrGet, createField, Field, Plugin } from 'roqueform';
import { AccessorContext } from './AccessorContext';

// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html#type-inference-in-conditional-types
type NoInfer<T> = T extends infer T ? T : never;

/**
 * Creates the new field.
 *
 * @returns The {@linkcode Field} instance.
 * @template T The root field value.
 */
export function useField<T = any>(): Field<T | undefined>;

/**
 * Creates the new field.
 *
 * @param initialValue The initial value assigned to the field.
 * @returns The {@linkcode Field} instance.
 * @template T The root field value.
 */
export function useField<T>(initialValue: T | (() => T)): Field<T>;

/**
 * Creates the new field enhanced by a plugin.
 *
 * @param initialValue The initial value assigned to the field.
 * @param plugin Enhances the field with additional functionality.
 * @returns The {@linkcode Field} instance.
 * @template T The root field value.
 * @template M The mixin added by the plugin.
 */
export function useField<T, M>(initialValue: T | (() => T), plugin: Plugin<M, NoInfer<T>>): Field<T, M> & M;

export function useField(initialValue?: unknown, plugin?: Plugin) {
  const accessor = useContext(AccessorContext);

  return (useRef<Field>().current ||= createField(callOrGet(initialValue), plugin!, accessor));
}
