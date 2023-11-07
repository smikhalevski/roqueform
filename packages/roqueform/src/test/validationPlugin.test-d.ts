import { expectType } from 'tsd';
import { Plugin, ValidationPlugin, validationPlugin } from 'roqueform';

expectType<Plugin<ValidationPlugin<unknown, void>>>(validationPlugin(() => undefined));
