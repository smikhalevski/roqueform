import { useContext, useRef } from 'react';
import { callOrGet, createField, Field, PluginInjector } from 'roqueform';
import { ValueAccessorContext } from './ValueAccessorContext';

// https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html#type-inference-in-conditional-types
type NoInfer<T> = T extends infer T ? T : never;

/**
 * Creates the new field.
 *
 * @returns The {@link Field} instance.
 * @template Value The root field value.
 */
export function useField<Value = any>(): Field<unknown, Value | undefined>;

/**
 * Creates the new field.
 *
 * @param initialValue The initial value assigned to the field.
 * @returns The {@link Field} instance.
 * @template Value The root field value.
 */
export function useField<Value>(initialValue: Value | (() => Value)): Field<unknown, Value>;

/**
 * Creates the new field enhanced by a plugin.
 *
 * @param initialValue The initial value assigned to the field.
 * @param plugin The plugin injector that enhances the field.
 * @returns The {@link Field} instance.
 * @template Value The root field value.
 * @template Plugin The plugin injected into the field.
 */
export function useField<Value, Plugin>(
  initialValue: Value | (() => Value),
  plugin: PluginInjector<Plugin, NoInfer<Value>>
): Field<Plugin, Value>;

export function useField<Value, Plugin>(
  initialValue: Value | (() => Value),
  plugin: PluginInjector<Plugin>
): Field<Plugin, Value>;

export function useField(initialValue?: unknown, plugin?: PluginInjector) {
  const accessor = useContext(ValueAccessorContext);

  return (useRef<Field>().current ||= createField(callOrGet(initialValue), plugin!, accessor));
}
