import { expectType } from 'tsd';
import { createField, Field, FieldPlugin } from '../../main/index.js';
import validationPlugin, { ValidationMixin } from '../../main/plugin/validation.js';

expectType<FieldPlugin<any, ValidationMixin<number, void>>>(validationPlugin(() => 222));

expectType<FieldPlugin<any, ValidationMixin<string, { aaa: 111 }>>>(
  validationPlugin<string, { aaa: 111 }>(() => 'xxx')
);

expectType<Field<string, ValidationMixin<number, void>>>(createField('xxx', [validationPlugin(() => 222)]));

expectType<number>(createField('xxx', [validationPlugin(() => 222)]).validate());
