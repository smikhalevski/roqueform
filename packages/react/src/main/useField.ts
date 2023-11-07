import { useContext, useRef } from 'react';
import { callOrGet, createField, Field, Plugin } from 'roqueform';
import { AccessorContext } from './AccessorContext';

// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html#type-inference-in-conditional-types
type NoInfer<T> = T extends infer T ? T : never;

/**
 * Creates the new field.
 *
 * @returns The {@link Field} instance.
 * @template Value The root field value.
 */
export function useField<Value = any>(): Field<Value | undefined>;

/**
 * Creates the new field.
 *
 * @param initialValue The initial value assigned to the field.
 * @returns The {@link Field} instance.
 * @template Value The root field value.
 */
export function useField<Value>(initialValue: Value | (() => Value)): Field<Value>;

/**
 * Creates the new field enhanced by a plugin.
 *
 * @param initialValue The initial value assigned to the field.
 * @param plugin Enhances the field with additional functionality.
 * @returns The {@link Field} instance.
 * @template Value The root field value.
 * @template Plugin The plugin added by the plugin.
 */
export function useField<Value, Plugin>(
  initialValue: Value | (() => Value),
  plugin: Plugin<Plugin, NoInfer<Value>>
): Field<Value, Plugin> & Plugin;

export function useField(initialValue?: unknown, plugin?: Plugin) {
  const accessor = useContext(AccessorContext);

  return (useRef<Field>().current ||= createField(callOrGet(initialValue), plugin!, accessor));
}
