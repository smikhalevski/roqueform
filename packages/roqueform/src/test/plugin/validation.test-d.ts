import { expectType } from 'tsd';
import { FieldPlugin } from '../../main/index.js';
import validationPlugin, { ValidationMixin } from '../../main/plugin/validation.js';

expectType<FieldPlugin<any, ValidationMixin<unknown>>>(validationPlugin({ validate() {} }));
