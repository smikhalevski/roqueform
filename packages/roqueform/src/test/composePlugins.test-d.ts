import { expectType } from 'tsd';
import { composePlugins, createField, PluginInjector } from 'roqueform';

declare const plugin1: PluginInjector<{ xxx: number }>;
declare const plugin2: PluginInjector<{ yyy: boolean }, { aaa: number }>;

expectType<PluginInjector<{ xxx: number } & { yyy: boolean }, { aaa: number }>>(composePlugins(plugin1, plugin2));

expectType<PluginInjector<{ xxx: number } & { yyy: boolean }, { aaa: number }>>(composePlugins(plugin2, plugin1));

const field = createField({ aaa: 111 }, composePlugins(plugin1, plugin2));

expectType<{ aaa: number }>(field.value);
expectType<number>(field.xxx);
expectType<boolean>(field.yyy);
