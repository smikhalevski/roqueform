import { expectType } from 'tsd';
import { createField } from 'roqueform';
import { resetPlugin } from '@roqueform/reset-plugin';

expectType<number>(createField({ foo: 111 }, resetPlugin()).at('foo').initialValue);
