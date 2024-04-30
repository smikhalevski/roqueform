import { PluginInjector, ValidationPlugin, validationPlugin } from 'roqueform';
import { expectType } from 'tsd';

expectType<PluginInjector<ValidationPlugin<unknown>>>(validationPlugin({ validate() {} }));
