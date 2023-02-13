import { expectType } from 'tsd';
import { applyPlugins, createField, objectAccessor, Plugin, ValidationMixin, validationPlugin } from 'roqueform';

const field1 = createField<{ foo: { bar?: string } | null }>(objectAccessor, { foo: null });

expectType<{ bar?: string } | null>(field1.at('foo').value);

expectType<string | undefined>(field1.at('foo').at('bar').value);

declare const plugin1: Plugin<{ aaa: number }>;
declare const plugin2: Plugin<{ bbb: boolean }>;

expectType<Plugin<{ aaa: number } & { bbb: boolean }>>(applyPlugins(plugin1, plugin2));

const field2 = createField(objectAccessor, { foo: 111 }, applyPlugins(plugin1, plugin2));

expectType<{ foo: number }>(field2.value);
expectType<number>(field2.aaa);
expectType<boolean>(field2.bbb);

expectType<Plugin<ValidationMixin<unknown, void>>>(validationPlugin(() => undefined));
