import {Enhancer} from './Field';

export function compose<A, B>(a: Enhancer<A>, b: Enhancer<B>): Enhancer<A & B>;

export function compose<A, B, C>(a: Enhancer<A>, b: Enhancer<B>, c: Enhancer<C>): Enhancer<A & B & C>;

export function compose<A, B, C, D>(a: Enhancer<A>, b: Enhancer<B>, c: Enhancer<C>, d: Enhancer<D>): Enhancer<A & B & C & D>;

export function compose<A, B, C, D, E>(a: Enhancer<A>, b: Enhancer<B>, c: Enhancer<C>, d: Enhancer<D>, e: Enhancer<D>): Enhancer<A & B & C & D & E>;

export function compose(...enhancers: Enhancer<any>[]): Enhancer<any> {
  return (field) => {
    for (const enhancer of enhancers) {
      field = enhancer(field);
    }
    return field;
  };
}
