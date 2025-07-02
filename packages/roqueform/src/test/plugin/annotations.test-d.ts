import { expectType } from 'tsd';
import { createField } from '../../main/index.js';
import annotationsPlugin from '../../main/plugin/annotations.js';

expectType<boolean>(createField({ aaa: 111 }, [annotationsPlugin({ xxx: true })]).at('aaa').annotations.xxx);

expectType<{ readonly [annotation: string]: any }>(createField({ aaa: 111 }, [annotationsPlugin()]).annotations);
