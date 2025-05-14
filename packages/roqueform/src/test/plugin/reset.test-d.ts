import { expectType } from 'tsd';
import { createField } from '../../main/index.js';
import resetPlugin from '../../main/plugin/reset.js';

expectType<number>(createField({ aaa: 111 }, [resetPlugin()]).at('aaa').initialValue);
