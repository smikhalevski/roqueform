import type { PluginInjector } from './types';

/**
 * @internal
 */
export function composePlugins<P1, V1>(a: PluginInjector<P1, V1>): PluginInjector<P1, V1>;

/**
 * @internal
 */
export function composePlugins<P1, V1, P2, V2>(
  a: PluginInjector<P1, V1>,
  b: PluginInjector<P2, V2>
): PluginInjector<P1 & P2, V1 & V2>;

/**
 * @internal
 */
export function composePlugins<P1, V1, P2, V2, P3, V3>(
  a: PluginInjector<P1, V1>,
  b: PluginInjector<P2, V2>,
  c: PluginInjector<P3, V3>
): PluginInjector<P1 & P2 & P3, V1 & V2 & V3>;

/**
 * @internal
 */
export function composePlugins<P1, V1, P2, V2, P3, V3, P4, V4>(
  a: PluginInjector<P1, V1>,
  b: PluginInjector<P2, V2>,
  c: PluginInjector<P3, V3>,
  d: PluginInjector<P4, V4>
): PluginInjector<P1 & P2 & P3 & P4, V1 & V2 & V3 & V4>;

/**
 * @internal
 */
export function composePlugins<P1, V1, P2, V2, P3, V3, P4, V4, P5, V5>(
  a: PluginInjector<P1, V1>,
  b: PluginInjector<P2, V2>,
  c: PluginInjector<P3, V3>,
  d: PluginInjector<P4, V4>,
  e: PluginInjector<P5, V5>
): PluginInjector<P1 & P2 & P3 & P4 & P5, V1 & V2 & V3 & V4 & V5>;

/**
 * @internal
 */
export function composePlugins<P1, V1, P2, V2, P3, V3, P4, V4, P5, V5, P6, V6>(
  a: PluginInjector<P1, V1>,
  b: PluginInjector<P2, V2>,
  c: PluginInjector<P3, V3>,
  d: PluginInjector<P4, V4>,
  e: PluginInjector<P5, V5>,
  f: PluginInjector<P6, V6>,
  ...other: PluginInjector<any, any>[]
): PluginInjector<P1 & P2 & P3 & P4 & P5 & P6, V1 & V2 & V3 & V4 & V5 & V6>;

/**
 * Composes multiple plugin callbacks into a single callback.
 *
 * @param plugins The array of plugin injectors to compose.
 * @returns The plugins injector that sequentially applies all provided injectors to a field.
 */
export function composePlugins(...plugins: PluginInjector[]): PluginInjector;

export function composePlugins(...plugins: PluginInjector[]): PluginInjector {
  if (plugins.length === 1) {
    return plugins[0];
  }
  return field => {
    for (const plugin of plugins) {
      plugin(field);
    }
    return field;
  };
}
