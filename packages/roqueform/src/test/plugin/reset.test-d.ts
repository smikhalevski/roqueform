import { expectType } from 'tsd';
import { createField } from '../../main';
import resetPlugin from '../../main/plugin/reset';

expectType<number>(createField({ aaa: 111 }, [resetPlugin()]).at('aaa').initialValue);
