import { composePlugins, createField, PluginInjector } from 'roqueform';
import { expectNotAssignable, expectType } from 'tsd';

interface Aaa {
  aaa: string;
}

interface Bbb {
  bbb: number;
}

interface Ccc {
  ccc: number;
}

declare const plugin1: PluginInjector;
declare const plugin2: PluginInjector<Aaa>;
declare const plugin3: PluginInjector<Bbb, Ccc>;

expectNotAssignable<PluginInjector>({} as PluginInjector<Aaa>);

expectNotAssignable<PluginInjector>({} as PluginInjector<Aaa, Bbb>);

expectNotAssignable<PluginInjector>({} as PluginInjector<unknown, Aaa>);

expectType<PluginInjector>(composePlugins(plugin1));

expectType<PluginInjector>(composePlugins(plugin1, plugin1));

expectType<PluginInjector<Aaa>>(composePlugins(plugin2, plugin2, plugin2, plugin2, plugin2, plugin2, plugin2, plugin2));

expectType<PluginInjector<Aaa>>(composePlugins(plugin1, plugin2));

expectType<PluginInjector<Bbb, Ccc>>(composePlugins(plugin1, plugin3));

expectType<PluginInjector<Aaa & Bbb, Ccc>>(composePlugins(plugin2, plugin3));

expectType<PluginInjector<Aaa & Bbb, Ccc>>(composePlugins(plugin3, plugin2));

expectNotAssignable<PluginInjector<Aaa & Bbb>>(composePlugins(plugin2, plugin3));

expectNotAssignable<PluginInjector<unknown, Ccc>>(composePlugins(plugin2, plugin3));

const field = createField({ ccc: 111 }, composePlugins(plugin2, plugin3));

expectType<Ccc>(field.value);
expectType<string>(field.aaa);
expectType<number>(field.bbb);
