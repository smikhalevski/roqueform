import { useContext, useRef } from 'react';
import type { InferPlugin } from 'roqueform';
import { callOrGet, createField, Field, PluginInjector } from 'roqueform';
import { ValueAccessorContext } from './ValueAccessorContext';

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
 * @param plugins The array of plugin injectors that enhances the field.
 * @returns The {@link Field} instance.
 * @template Value The root field value.
 * @template Plugin The plugin injected into the field.
 */
export function useField<Value, Plugins extends PluginInjector<any>[]>(
  initialValue: Value | (() => Value),
  plugins?: Plugins
): Field<Value, InferPlugin<Plugins[number]>>;

export function useField(initialValue?: unknown, plugins?: PluginInjector[]) {
  const accessor = useContext(ValueAccessorContext);

  return (useRef<Field>().current ||= createField(callOrGet(initialValue), plugins, accessor));
}
