import { expectType } from 'tsd';
import { type ErrorsPlugin, errorsPlugin, PluginInjector, ValidationPlugin, validationPlugin } from 'roqueform';

expectType<PluginInjector<ValidationPlugin<unknown>>>(validationPlugin({ validate() {} }));

expectType<PluginInjector<ErrorsPlugin & ValidationPlugin<unknown>>>(
  validationPlugin(errorsPlugin(), { validate() {} })
);
