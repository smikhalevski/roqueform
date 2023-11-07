import { PluginCallback } from './typings';

/**
 * Composes a plugin from multiple plugins.
 */
export function composePlugins<T, A, B>(a: PluginCallback<A, T>, b: PluginCallback<B, T>): PluginCallback<A & B, T>;

/**
 * Composes a plugin from multiple plugins.
 */
export function composePlugins<T, A, B, C>(
  a: PluginCallback<A, T>,
  b: PluginCallback<B, T>,
  c: PluginCallback<C, T>
): PluginCallback<A & B & C, T>;

/**
 * Composes a plugin from multiple plugins.
 */
export function composePlugins<T, A, B, C, D>(
  a: PluginCallback<A, T>,
  b: PluginCallback<B, T>,
  c: PluginCallback<C, T>,
  d: PluginCallback<D, T>
): PluginCallback<A & B & C & D, T>;

/**
 * Composes a plugin from multiple plugins.
 */
export function composePlugins<T, A, B, C, D, E>(
  a: PluginCallback<A, T>,
  b: PluginCallback<B, T>,
  c: PluginCallback<C, T>,
  d: PluginCallback<D, T>,
  e: PluginCallback<E, T>
): PluginCallback<A & B & C & D & E, T>;

/**
 * Composes a plugin from multiple plugins.
 */
export function composePlugins<T, A, B, C, D, E, F>(
  a: PluginCallback<A, T>,
  b: PluginCallback<B, T>,
  c: PluginCallback<C, T>,
  d: PluginCallback<D, T>,
  e: PluginCallback<E, T>,
  f: PluginCallback<F, T>,
  ...other: PluginCallback<any, T>[]
): PluginCallback<A & B & C & D & E & F, T>;

export function composePlugins(...plugins: PluginCallback[]): PluginCallback {
  return field => {
    for (const plugin of plugins) {
      plugin(field);
    }
    return field;
  };
}
