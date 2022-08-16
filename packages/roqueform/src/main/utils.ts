export type Writable<T> = { -readonly [P in keyof T]: T[P] };

export function callOrGet<T, A extends any[]>(value: T | ((...args: A) => T), ...args: A): T {
  return typeof value === 'function' ? (value as Function)(...args) : value;
}

export const isEqual = Object.is;
