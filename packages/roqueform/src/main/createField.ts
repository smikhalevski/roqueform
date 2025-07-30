import { naturalValueAccessor } from './naturalValueAccessor.js';
import { Field, FieldImpl, FieldPlugin, ValueAccessor } from './FieldImpl.js';
import { callOrGet } from './utils.js';

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
export function createField<Value>(initialValue: Value | (() => Value)): Field<Value>;

/**
 * Creates the new field instance.
 *
 * @param initialValue The initial value assigned to the field.
 * @param plugins The array of plugins applied to the field and its children.
 * @param accessor Resolves values for child fields.
 * @template Value The root field initial value.
 * @template Plugins The array of plugins applied to the field and its children.
 */
export function createField<Value, Plugins extends FieldPlugin<unknown>[]>(
  initialValue: Value | (() => Value),
  plugins: Plugins,
  accessor?: ValueAccessor
): Field<Value, InjectedMixin<Plugins>>;

/**
 * Creates the new field instance.
 *
 * @param initialValue The initial value assigned to the field.
 * @param plugins The array of plugins applied to the field and its children.
 * @param accessor Resolves values for child fields.
 * @template Plugins The array of plugins applied to the field and its children.
 */
export function createField<Plugins extends FieldPlugin[]>(
  initialValue: RequiredValue<Plugins> | (() => RequiredValue<Plugins>),
  plugins: Plugins,
  accessor?: ValueAccessor
): Field<RequiredValue<Plugins>, InjectedMixin<Plugins>>;

export function createField(initialValue?: any, plugins: FieldPlugin[] = [], accessor = naturalValueAccessor): Field {
  const field = new FieldImpl(null, null, callOrGet(initialValue), accessor, plugins);

  for (const plugin of plugins) {
    plugin(field);
  }

  return field;
}

type InjectedMixin<T extends any[]> = T extends never[] ? {} : UnionToIntersection<InferMixin<T[number]>>;

type RequiredValue<T extends any[]> = T extends never[] ? any : UnboxValue<UnionToIntersection<InferValue<T[number]>>>;

type InferMixin<T> = T extends FieldPlugin<any, infer M> ? M : never;

type InferValue<T> = T extends FieldPlugin<infer V, infer _> ? [AnyToUnknown<V>] : never;

type UnboxValue<T> = T extends [any] ? T[0] : never;

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

type AnyToUnknown<T> = 0 extends 1 & T ? unknown : T;
