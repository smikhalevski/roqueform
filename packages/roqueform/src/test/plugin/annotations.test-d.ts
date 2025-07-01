import { expectType } from 'tsd';
import { createField } from '../../main/index.js';
import annotationsPlugin from '../../main/plugin/annotations.js';

// expectType<boolean>(createField({ aaa: 111 }, [annotationsPlugin({ createObservableRefCollection: true })]).at('aaa').annotations.createObservableRefCollection);

expectType<{ readonly [annotation: string]: any }>(createField({ aaa: 111 }, [annotationsPlugin()]).annotations);
