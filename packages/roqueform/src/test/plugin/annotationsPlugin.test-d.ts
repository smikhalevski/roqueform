import { expectType } from 'tsd';
import { createField } from '../../../lib';
import { annotationsPlugin } from '@roqueform/annotations-plugin';

expectType<boolean>(createField({ aaa: 111 }, annotationsPlugin({ xxx: true })).at('aaa').annotations.xxx);

expectType<{ readonly [annotation: string]: any }>(createField({ aaa: 111 }, annotationsPlugin()).annotations);
