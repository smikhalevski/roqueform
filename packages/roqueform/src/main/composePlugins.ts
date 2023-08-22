import { Plugin } from './shared-types';

/**
 * Composes a plugin from multiple plugins.
 */
export function composePlugins<T, A, B>(a: Plugin<A, T>, b: Plugin<B, T>): Plugin<A & B, T>;

/**
 * Composes a plugin from multiple plugins.
 */
export function composePlugins<T, A, B, C>(a: Plugin<A, T>, b: Plugin<B, T>, c: Plugin<C, T>): Plugin<A & B & C, T>;

/**
 * Composes a plugin from multiple plugins.
 */
export function composePlugins<T, A, B, C, D>(
  a: Plugin<A, T>,
  b: Plugin<B, T>,
  c: Plugin<C, T>,
  d: Plugin<D, T>
): Plugin<A & B & C & D, T>;

/**
 * Composes a plugin from multiple plugins.
 */
export function composePlugins<T, A, B, C, D, E>(
  a: Plugin<A, T>,
  b: Plugin<B, T>,
  c: Plugin<C, T>,
  d: Plugin<D, T>,
  e: Plugin<E, T>
): Plugin<A & B & C & D & E, T>;

/**
 * Composes a plugin from multiple plugins.
 */
export function composePlugins<T, A, B, C, D, E, F>(
  a: Plugin<A, T>,
  b: Plugin<B, T>,
  c: Plugin<C, T>,
  d: Plugin<D, T>,
  e: Plugin<E, T>,
  f: Plugin<F, T>,
  ...other: Plugin<any, T>[]
): Plugin<A & B & C & D & E & F, T>;

export function composePlugins(...plugins: Plugin[]): Plugin {
  return (field, accessor, notify) => {
    for (const plugin of plugins) {
      plugin(field, accessor, notify);
    }
    return field;
  };
}
