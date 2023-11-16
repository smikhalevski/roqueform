import { expectType } from 'tsd';
import { PluginInjector, ValidationPlugin, validationPlugin } from 'roqueform';

expectType<PluginInjector<ValidationPlugin<unknown, void>>>(validationPlugin({ validator: () => undefined }));
