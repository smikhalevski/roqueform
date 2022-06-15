import {Accessor} from './Form';
import {isObjectLike} from './utils';

export class KeysAccessor implements Accessor<any, any> {

  constructor(private __keys: any[]) {
  }

  get(upstreamValue: any): any {
    for (const key of this.__keys) {
      if (!isObjectLike(upstreamValue)) {
        return undefined;
      }
      upstreamValue = upstreamValue instanceof Map ? upstreamValue.get(key) : upstreamValue[key];
    }
    return upstreamValue;
  }

  set(upstreamValue: any, value: any): any {
    return cloneOrCreate(upstreamValue, this.__keys, 0, value);
  }
}

function cloneOrCreate(upstreamValue: any, keys: any[], keyIndex: number, value: unknown): unknown {
  if (keyIndex === keys.length) {
    return value;
  }

  const key = keys[keyIndex];

  if (!isObjectLike(upstreamValue)) {
    // Not an object
    upstreamValue = typeof key === 'number' ? [] : {};
    upstreamValue[key] = cloneOrCreate(undefined, keys, keyIndex + 1, value);

  } else if (upstreamValue instanceof Map) {
    // Map-like
    upstreamValue = new (upstreamValue.constructor as MapConstructor)(upstreamValue).set(key, cloneOrCreate(upstreamValue.get(key), keys, keyIndex + 1, value));

  } else {
    // An array or a plain object
    upstreamValue = Array.isArray(upstreamValue) ? upstreamValue.slice(0) : Object.assign({}, upstreamValue);
    upstreamValue[key] = cloneOrCreate(upstreamValue[key], keys, keyIndex + 1, value);
  }

  return upstreamValue;
}
