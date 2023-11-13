import { expectType } from 'tsd';
import { createField } from 'roqueform';
import { annotationsPlugin } from '@roqueform/annotations-plugin';

expectType<boolean>(createField({ aaa: 111 }, annotationsPlugin({ xxx: true })).at('aaa').annotations.xxx);

expectType<{ [annotation: string]: any }>(createField({ aaa: 111 }, annotationsPlugin()).annotations);
