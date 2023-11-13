import { expectType } from 'tsd';
import { composePlugins, createField, PluginInjector } from 'roqueform';

declare const plugin1: PluginInjector<{ xxx: number }>;
declare const plugin2: PluginInjector<{ yyy: boolean }>;

expectType<PluginInjector<{ xxx: number } & { yyy: boolean }>>(composePlugins(plugin1, plugin2));

const field = createField({ aaa: 111 }, composePlugins(plugin1, plugin2));

expectType<{ aaa: number }>(field.value);
expectType<number>(field.xxx);
expectType<boolean>(field.yyy);
