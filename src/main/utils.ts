export function callOrGet<T, A extends any[]>(value: T | ((...args: A) => T), ...args: A): T {
  return typeof value === 'function' ? (value as Function)(...args) : value;
}

export function isObjectLike<T>(value: T): value is T & object {
  return value !== null && typeof value === 'object';
}
