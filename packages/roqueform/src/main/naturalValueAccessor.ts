import { ValueAccessor } from './typings';
import { isEqual } from './utils';

/**
 * The value accessor that reads and writes key-value pairs to well-known object instances.
 */
export const naturalValueAccessor: ValueAccessor = {
  get(obj, key) {
    if (isPrimitive(obj)) {
      return undefined;
    }

    if (Array.isArray(obj)) {
      key = toArrayIndex(key);
      return key !== -1 ? obj[key] : undefined;
    }

    if (isMapLike(obj)) {
      return obj.get(key);
    }

    if (isSetLike(obj)) {
      key = toArrayIndex(key);
      return key !== -1 ? Array.from(obj)[key] : undefined;
    }

    return obj[key];
  },

  set(obj, key, value) {
    if (isPrimitive(obj)) {
      let index;

      if (typeof key === 'number' && (index = toArrayIndex(key)) !== -1) {
        obj = [];
        obj[index] = value;
      } else {
        obj = {};
        obj[key] = value;
      }
      return obj;
    }

    if (Array.isArray(obj)) {
      if (isEqual(obj[key], value)) {
        return obj;
      }
      obj = obj.slice(0);
      obj[key] = value;
      return obj;
    }

    const prototype = Object.getPrototypeOf(obj);

    // Object
    if (prototype === null) {
      if (isEqual(obj[key], value)) {
        return obj;
      }
      obj = Object.assign(Object.create(null), obj);
      obj[key] = value;
      return obj;
    }

    if (isMapLike(obj)) {
      return isEqual(obj.get(key), value) ? obj : new prototype.constructor(obj).set(key, value);
    }

    if (isSetLike(obj)) {
      key = toArrayIndex(key);

      if (key === -1) {
        return obj;
      }

      const values = Array.from(obj);

      if (isEqual(values[key], value)) {
        return obj;
      }
      values[key] = value;
      return new prototype.constructor(values);
    }

    // Object
    if (isEqual(obj[key], value)) {
      return obj;
    }
    obj = Object.assign({}, obj);
    obj[key] = value;
    return obj;
  },
};

/**
 * Converts `k` to a non-negative integer if it represents a valid array index, or returns -1 if `k` isn't an index.
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
  return typeof obj.add === 'function' && typeof obj[Symbol.iterator] === 'function';
}
