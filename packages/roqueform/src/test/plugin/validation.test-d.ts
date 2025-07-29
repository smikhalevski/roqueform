import { expectType } from 'tsd';
import { createField, Field, FieldPlugin } from '../../main/index.js';
import validationPlugin, { ValidationMixin } from '../../main/plugin/validation.js';

expectType<FieldPlugin<any, ValidationMixin<number, void>>>(validationPlugin(() => 222));

expectType<FieldPlugin<any, ValidationMixin<number, { aaa: number }>>>(
  validationPlugin<number, { aaa: 111 }>(() => 222)
);

expectType<Field<string, ValidationMixin<number, void>>>(createField('xxx', [validationPlugin(() => 222)]));

expectType<number>(createField('xxx', [validationPlugin(() => 222)]).validate());
