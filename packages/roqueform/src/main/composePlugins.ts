import { PluginInjector } from './types';

/**
 * @internal
 */
export function composePlugins<T, A, B>(a: PluginInjector<A, T>, b: PluginInjector<B, T>): PluginInjector<A & B, T>;

/**
 * @internal
 */
export function composePlugins<T, A, B, C>(
  a: PluginInjector<A, T>,
  b: PluginInjector<B, T>,
  c: PluginInjector<C, T>
): PluginInjector<A & B & C, T>;

/**
 * @internal
 */
export function composePlugins<T, A, B, C, D>(
  a: PluginInjector<A, T>,
  b: PluginInjector<B, T>,
  c: PluginInjector<C, T>,
  d: PluginInjector<D, T>
): PluginInjector<A & B & C & D, T>;

/**
 * @internal
 */
export function composePlugins<T, A, B, C, D, E>(
  a: PluginInjector<A, T>,
  b: PluginInjector<B, T>,
  c: PluginInjector<C, T>,
  d: PluginInjector<D, T>,
  e: PluginInjector<E, T>
): PluginInjector<A & B & C & D & E, T>;

/**
 * @internal
 */
export function composePlugins<T, A, B, C, D, E, F>(
  a: PluginInjector<A, T>,
  b: PluginInjector<B, T>,
  c: PluginInjector<C, T>,
  d: PluginInjector<D, T>,
  e: PluginInjector<E, T>,
  f: PluginInjector<F, T>,
  ...other: PluginInjector<any, T>[]
): PluginInjector<A & B & C & D & E & F, T>;

/**
 * Composes multiple plugin callbacks into a single callback.
 *
 * @param plugins The array of plugin injectors to compose.
 * @returns The plugins injector that sequentially applies all provided injectors into a field.
 */
export function composePlugins(...plugins: PluginInjector[]): PluginInjector;

export function composePlugins(...plugins: PluginInjector[]): PluginInjector {
  return field => {
    for (const plugin of plugins) {
      plugin(field);
    }
    return field;
  };
}
