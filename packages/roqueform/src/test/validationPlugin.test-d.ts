import { expectType } from 'tsd';
import { Plugin, ValidationMixin, validationPlugin } from 'roqueform';

expectType<Plugin<ValidationMixin<unknown, void>>>(validationPlugin(() => undefined));
