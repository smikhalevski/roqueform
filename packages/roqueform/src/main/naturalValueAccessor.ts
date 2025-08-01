import { ValueAccessor } from './FieldImpl.js';
import { toArrayIndex } from './utils.js';

/**
 * The value accessor that reads and writes key-value pairs to well-known object types.
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

    const prototype = Object.getPrototypeOf(obj);

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
    obj instanceof Symbol ||
    (typeof BigInt !== 'undefined' && obj instanceof BigInt)
  );
}

function isMapLike(obj: any): obj is Map<unknown, unknown> {
  return typeof obj.set === 'function' && typeof obj.get === 'function';
}

function isSetLike(obj: any): obj is Set<unknown> {
  return typeof obj.add === 'function' && typeof obj[Symbol.iterator] === 'function';
}
