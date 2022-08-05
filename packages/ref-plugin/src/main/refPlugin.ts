import { createRef, RefObject } from 'react';
import { Plugin } from 'roqueform';

export interface RefPlugin<T> {
  ref: RefObject<T>;
}

/**
 * Adds `ref` property to a field.
 */
export function refPlugin<T = any>(): Plugin<any, RefPlugin<T>> {
  return field => {
    Object.assign(field, { ref: createRef<T>() });
  };
}
