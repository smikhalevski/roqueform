import { expectType } from 'tsd';
import constraintValidationPlugin, { ConstraintValidationMixin } from '../../main/plugin/constraint-validation.js';
import { createField, Field } from '../../main/index.js';
import refPlugin, { RefMixin } from '../../main/plugin/ref.js';
import resetPlugin, { ResetMixin } from '../../main/plugin/reset.js';
import uncontrolledPlugin, { UncontrolledMixin } from '../../main/plugin/uncontrolled.js';

expectType<Field<string, RefMixin & ConstraintValidationMixin>>(
  createField('aaa', [refPlugin(), constraintValidationPlugin()])
);

expectType<Field<string, RefMixin & ResetMixin>>(createField('aaa', [refPlugin(), resetPlugin()]));

expectType<Field<string, UncontrolledMixin & ResetMixin>>(createField('aaa', [uncontrolledPlugin(), resetPlugin()]));

expectType<Field<string, UncontrolledMixin>>(createField('aaa', [uncontrolledPlugin()]));

expectType<Field<string, RefMixin>>(createField('aaa', [refPlugin(), uncontrolledPlugin()]));

expectType<Field<string, ConstraintValidationMixin>>(
  createField('aaa', [uncontrolledPlugin(), constraintValidationPlugin()])
);
