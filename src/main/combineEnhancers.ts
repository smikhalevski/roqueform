import {Enhancer} from './Field';

export function combineEnhancers<T1, T2>(e1: Enhancer<T1>, e2: Enhancer<T2>): Enhancer<T1 & T2> {
  return (field) => e2(e1(field)) as any;
}
