import { expectType } from 'tsd';
import { createField } from 'roqueform';
import { resetPlugin } from '@roqueform/reset-plugin';

expectType<number>(createField({ aaa: 111 }, resetPlugin()).at('aaa').initialValue);
