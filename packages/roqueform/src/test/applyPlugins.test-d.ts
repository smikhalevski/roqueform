import { expectType } from 'tsd';
import { composePlugins, createField, Plugin } from 'roqueform';

declare const plugin1: Plugin<{ aaa: number }>;
declare const plugin2: Plugin<{ bbb: boolean }>;

expectType<Plugin<{ aaa: number } & { bbb: boolean }>>(composePlugins(plugin1, plugin2));

const field = createField({ foo: 111 }, composePlugins(plugin1, plugin2));

expectType<{ foo: number }>(field.value);
expectType<number>(field.aaa);
expectType<boolean>(field.bbb);
