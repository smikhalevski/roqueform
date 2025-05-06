import { naturalValueAccessor } from './naturalValueAccessor';
import { Field, FieldImpl, FieldPlugin, ValueAccessor } from './Field';

/**
 * Creates the new field instance.
 *
 * @template Value The root field value.
 */
export function createField<Value = any>(): Field<Value | undefined>;

/**
 * Creates the new field instance.
 *
 * @param initialValue The initial value assigned to the field.
 * @template Value The root field value.
 */
export function createField<Value>(initialValue: Value): Field<Value>;

/**
 * Creates the new field instance.
 *
 * @param initialValue The initial value assigned to the field.
 * @param plugins The array of plugins applied to the field and its children.
 * @param accessor Resolves values for child fields.
 * @template Value The root field initial value.
 * @template Plugins The array of plugins applied to the field and its children.
 */
export function createField<Value extends PluginsValue<Plugins>, Plugins extends FieldPlugin[]>(
  initialValue: Value,
  plugins: Plugins,
  accessor?: ValueAccessor
): Field<Value, PluginsMixin<Plugins>>;

export function createField(initialValue?: any, plugins: FieldPlugin[] = [], accessor = naturalValueAccessor): Field {
  const field = new FieldImpl(null, null, initialValue, accessor, plugins);

  for (const plugin of plugins) {
    plugin(field);
  }

  return field;
}

type PluginsValue<T extends any[]> = T extends never[] ? any : Unbox<UnionToIntersection<BoxedPluginValue<T[number]>>>;

type PluginsMixin<T extends any[]> = T extends never[] ? any : Unbox<UnionToIntersection<BoxedPluginMixin<T[number]>>>;

type BoxedPluginValue<T> = T extends FieldPlugin<infer Value, any> ? [Value] : never;

type BoxedPluginMixin<T> = T extends FieldPlugin<any, infer Mixin> ? [Mixin] : never;

type Unbox<T> = T extends [any] ? T[0] : never;

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
