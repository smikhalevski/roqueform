import { expectType } from 'tsd';
import { createField, objectAccessor } from 'roqueform';
import { resetPlugin } from '../main';

expectType<number>(createField(objectAccessor, { foo: 111 }, resetPlugin()).at('foo').initialValue);
