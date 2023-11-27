import { ValueAccessor } from './types';

/**
 * The value accessor that reads and writes key-value pairs to well-known object instances.
 */
export const naturalValueAccessor: ValueAccessor = {
  get(obj, key) {
    if (isPrimitive(obj)) {
      return undefined;
    }

    if (Array.isArray(obj)) {
      return toArrayIndex(key) !== -1 ? obj[key] : undefined;
    }

    if (isMapLike(obj)) {
      return obj.get(key);
    }

    if (isSetLike(obj)) {
      return toArrayIndex(key) !== -1 ? Array.from(obj)[key] : undefined;
    }

    return obj[key];
  },

  set(obj, key, value) {
    let prototype;

    if (isPrimitive(obj)) {
      obj = typeof key === 'number' && toArrayIndex(key) !== -1 ? [] : {};
      obj[key] = value;
      return obj;
    }

    if (Array.isArray(obj)) {
      if (typeof key === 'number' && toArrayIndex(key) !== -1) {
        obj = obj.slice(0);
        obj[key] = value;
      }
      return obj;
    }

    prototype = Object.getPrototypeOf(obj);

    if (isMapLike(obj)) {
      return new prototype.constructor(obj).set(key, value);
    }

    if (isSetLike(obj)) {
      key = toArrayIndex(key);

      if (key === -1) {
        return obj;
      }

      obj = Array.from(obj);

      // Prevent unexpected undefined values
      key = Math.min(key, obj.length);

      obj[key] = value;
      return new prototype.constructor(obj);
    }

    obj = Object.assign(Object.create(prototype), obj);
    obj[key] = value;
    return obj;
  },
};

/**
 * Returns a non-negative integer if argument represents a valid array index, or returns -1 if argument isn't an index.
 */
function toArrayIndex(k: any): number {
  return (typeof k === 'number' || (typeof k === 'string' && k === '' + (k = +k))) && k >>> 0 === k ? k : -1;
}

function isPrimitive(obj: any): boolean {
  return (
    obj === null ||
    obj === undefined ||
    typeof obj !== 'object' ||
    obj instanceof Date ||
    obj instanceof RegExp ||
    obj instanceof String ||
    obj instanceof Number ||
    obj instanceof Boolean ||
    obj instanceof BigInt ||
    obj instanceof Symbol
  );
}

function isMapLike(obj: any): obj is Map<unknown, unknown> {
  return typeof obj.set === 'function' && typeof obj.get === 'function';
}

function isSetLike(obj: any): obj is Set<unknown> {
  return typeof obj.add === 'function' && typeof Symbol === 'function' && typeof obj[Symbol.iterator] === 'function';
}
