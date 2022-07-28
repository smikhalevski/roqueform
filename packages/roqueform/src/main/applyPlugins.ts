import { Plugin } from './Field';

/**
 * Composes a plugin from multiple plugins.
 */
export function applyPlugins<T, A, B>(a: Plugin<T, A>, b: Plugin<T, B>): Plugin<T, A & B>;

/**
 * Composes a plugin from multiple plugins.
 */
export function applyPlugins<T, A, B, C>(a: Plugin<T, A>, b: Plugin<T, B>, c: Plugin<T, C>): Plugin<T, A & B & C>;

/**
 * Composes a plugin from multiple plugins.
 */
export function applyPlugins<T, A, B, C, D>(
  a: Plugin<T, A>,
  b: Plugin<T, B>,
  c: Plugin<T, C>,
  d: Plugin<T, D>
): Plugin<T, A & B & C & D>;

/**
 * Composes a plugin from multiple plugins.
 */
export function applyPlugins<T, A, B, C, D, E>(
  a: Plugin<T, A>,
  b: Plugin<T, B>,
  c: Plugin<T, C>,
  d: Plugin<T, D>,
  e: Plugin<T, D>
): Plugin<T, A & B & C & D & E>;

/**
 * Composes a plugin from multiple plugins.
 */
export function applyPlugins<T, A, B, C, D, E>(
  a: Plugin<T, A>,
  b: Plugin<T, B>,
  c: Plugin<T, C>,
  d: Plugin<T, D>,
  e: Plugin<T, D>,
  ...other: Plugin<T, any>[]
): Plugin<T, A & B & C & D & E>;

export function applyPlugins(...plugins: Plugin<unknown, unknown>[]): Plugin<unknown, unknown> {
  return field => {
    for (const plugin of plugins) {
      field = plugin(field);
    }
    return field;
  };
}
