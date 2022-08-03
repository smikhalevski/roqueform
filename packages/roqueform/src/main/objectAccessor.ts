import { Accessor } from './Field';
import { isEqual } from './utils';

/**
 * The accessor that reads and writes key-value pairs to object and arrays.
 */
export const objectAccessor: Accessor = {
  get(obj, key) {
    return obj?.[key];
  },

  set(obj, key, value) {
    if (obj !== null && typeof obj === 'object') {
      if (isEqual(obj[key], value)) {
        // Field value is unchanged
        return obj;
      }

      obj = Array.isArray(obj) ? obj.slice(0) : Object.assign({}, obj);
    } else {
      obj = typeof key === 'number' ? [] : {};
    }

    obj[key] = value;
    return obj;
  },
};
