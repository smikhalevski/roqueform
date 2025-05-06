import { expectType } from 'tsd';
import { FieldPlugin } from '../../main';
import validationPlugin, { ValidationMixin } from '../../main/plugin/validation';

expectType<FieldPlugin<any, ValidationMixin<unknown>>>(validationPlugin({ validate() {} }));
