import { expectType } from 'tsd';
import { composePlugins, createField, PluginInjector } from 'roqueform';

declare const plugin1: PluginInjector<{ aaa: number }>;
declare const plugin2: PluginInjector<{ bbb: boolean }>;

expectType<PluginInjector<{ aaa: number } & { bbb: boolean }>>(composePlugins(plugin1, plugin2));

const field = createField({ foo: 111 }, composePlugins(plugin1, plugin2));

expectType<{ foo: number }>(field.value);
expectType<number>(field.aaa);
expectType<boolean>(field.bbb);
