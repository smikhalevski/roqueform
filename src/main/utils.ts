export function callOrGet<T, A extends any[]>(value: T | ((...args: A) => T), ...args: A): T {
  return typeof value === 'function' ? (value as Function)(...args) : value;
}

export function die(message?: string): never {
  throw new Error(message)
}
